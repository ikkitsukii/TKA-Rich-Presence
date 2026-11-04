local M = {}
local function base64(data)
    local chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    local out = {}
    for i = 1, #data, 3 do
        local a, b, c = data:byte(i, i + 2)
        local n = (a << 16) | ((b or 0) << 8) | (c or 0)
        out[#out + 1] = chars:sub(((n >> 18) & 63) + 1, ((n >> 18) & 63) + 1)
        out[#out + 1] = chars:sub(((n >> 12) & 63) + 1, ((n >> 12) & 63) + 1)
        out[#out + 1] = b and chars:sub(((n >> 6) & 63) + 1, ((n >> 6) & 63) + 1) or '='
        out[#out + 1] = c and chars:sub((n & 63) + 1, (n & 63) + 1) or '='
    end
    return table.concat(out)
end
local function encodedCommand(text)
    local bytes = {}
    local function unit(v) bytes[#bytes + 1] = string.char(v & 255, (v >> 8) & 255) end
    for _, cp in utf8.codes(text) do
        if cp > 65535 then cp = cp - 65536; unit(55296 + (cp >> 10)); unit(56320 + (cp & 1023))
        else unit(cp) end
    end
    return base64(table.concat(bytes))
end
function M.command(source)
    local file = source:gsub('^@', ''):gsub('/', '\\')
    local root = file:match('^(.*)\\[Ss]cripts\\[^\\]+$')
    if not root or not root:match('^%a:\\') then return nil, 'Cannot locate absolute mod directory' end
    local script = root .. '\\Bridge\\AutoStart.ps1'
    -- Encode the entire PowerShell expression: shell metacharacters in paths never become shell code.
    local expr = "& '" .. script:gsub("'", "''") .. "'"
    return 'powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand ' .. encodedCommand(expr)
end
function M.start()
    local command, err = M.command(debug.getinfo(1, 'S').source)
    if not command then print('[TKA_RPC] AUTOSTART_ERROR ' .. err .. '\n'); return end
    local run = function()
        local ok, reason, code = os.execute(command)
        if ok then print('[TKA_RPC] Autostart launcher completed\n')
        else print('[TKA_RPC] AUTOSTART_ERROR ' .. tostring(reason) .. ' ' .. tostring(code) .. '\n') end
    end
    if type(ExecuteAsync) == 'function' then ExecuteAsync(run) else run() end
end
return M
