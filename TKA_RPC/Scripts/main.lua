local UEHelpers = require("UEHelpers")
local Interactions = require("Interactions")
local AutoStart = require("AutoStart")
local started, pending, lastError = os.time(), false, nil
local function safe(fn) local ok, v = pcall(fn); if ok then return v end end
local function valid(o) return o ~= nil and safe(function() return o:IsValid() end) == true end
local function read(o, key) if valid(o) then return safe(function() return o[key] end) end end
local function class(o) if valid(o) then return safe(function() return o:GetClass():GetFName():ToString() end) end end
local function stringValue(v)
    if type(v) == "string" then return v end
    if v ~= nil then return safe(function() return v:ToString() end) end
end
local function quote(v)
    return '"' .. v:gsub('[%z\1-\31\\"]', function(c)
        if c == '\\' then return '\\\\' end
        if c == '"' then return '\\"' end
        return string.format('\\u%04x', c:byte())
    end) .. '"'
end
local function json(t)
    local parts = {}
    for k, v in pairs(t) do
        local value
        if type(v) == "string" then value = quote(v)
        elseif type(v) == "number" and v == v and v ~= math.huge and v ~= -math.huge then value = tostring(v) end
        if value then parts[#parts + 1] = quote(k) .. ':' .. value end
    end
    table.sort(parts)
    return '{' .. table.concat(parts, ',') .. '}'
end
local function capture()
    local pc = UEHelpers.GetPlayerController()
    local world = valid(pc) and safe(function() return pc:GetWorld() end) or nil
    if not valid(world) then world = UEHelpers.GetWorld() end
    if not valid(world) then return end
    local map = world:GetFName():ToString()
    local pawn = read(pc, "Pawn")
    local gs, gm = read(world, "GameState"), read(world, "AuthorityGameMode")
    local interaction = Interactions.sample(world, read(gs, "UserInterface"))
    local gmClass, pawnClass = class(gm) or "", class(pawn) or ""
    local state = {map = map, session_start = started, session_seconds = os.time() - started,
        game_mode_class = gmClass, pawn_class = pawnClass}
    local lower = map:lower()
    if lower:find("^menu") or lower == "intro" then
        state.phase = "menu"
    elseif lower:find("loading", 1, true) then
        state.phase = "loading"
    else
        state.phase = "playing"
        state.interaction = interaction
        if gmClass:find("Challenge", 1, true) or pawnClass:find("ChallengeMode", 1, true) then
            state.mode = "Desafio"
        elseif gmClass:find("Plots_GameMode", 1, true) or pawnClass:find("StoryMode", 1, true) then
            state.mode = "História"
        else state.mode = "Outro modo" end
        state.caption = stringValue(read(gs, "Level Caption"))
        local difficulty = read(gs, "Current Game Difficulty")
        if type(difficulty) == "number" then state.difficulty = difficulty end
        local hp, hpMax = read(pawn, "health"), read(pawn, "Health Max")
        if type(hp) == "number" and type(hpMax) == "number" and hpMax > 0 then
            state.health, state.health_max = hp, hpMax
        end
    end
    print("[TKA_RPC] STATE " .. json(state) .. "\n")
end
print("[TKA_RPC] Loaded v0.4.0; read-only collector; automatic RPC helper\n")
AutoStart.start()
LoopAsync(5000, function()
    if pending then return false end
    pending = true
    local queued, err = pcall(function()
        ExecuteInGameThread(function()
            local ok, captureError = pcall(capture)
            pending = false
            if not ok and tostring(captureError) ~= lastError then
                lastError = tostring(captureError)
                print("[TKA_RPC] ERROR " .. lastError .. "\n")
            elseif ok then lastError = nil end
        end)
    end)
    if not queued then pending = false; print("[TKA_RPC] SCHEDULER_ERROR " .. tostring(err) .. "\n") end
    return false
end)
