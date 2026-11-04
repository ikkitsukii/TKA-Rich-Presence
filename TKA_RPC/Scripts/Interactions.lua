-- Observed story save entry points. A call is not proof of completed disk I/O.
local M = {}
local hooks, recent, lastMap = {}, nil, nil
local function safe(fn) local ok,v=pcall(fn); if ok then return v end end
local function valid(o) return o ~= nil and safe(function() return o:IsValid() end) == true end
local function worldName(world) return valid(world) and safe(function() return world:GetFName():ToString() end) or nil end
local function panelOpen(panel, hud)
    if not valid(panel) or not valid(hud) then return false end
    if safe(function() return hud:IsInViewport() end)~=true then return false end
    if safe(function() return hud:IsVisible() end)~=true then return false end
    local node=panel
    for _=1,32 do
        if safe(function() return node:IsVisible() end)~=true then return false end
        local parent=safe(function() return node:GetParent() end)
        if not valid(parent) then return true end
        node=parent
    end
    return false
end
local paths = {
    '/Game/Project/Classes/GameMode/Plots_GameState.Plots_GameState_C:Auto Save',
    '/Game/Project/Classes/GameMode/Plots_GameState.Plots_GameState_C:Save Game',
}
function M.sample(world, hud)
    local map = worldName(world)
    if map ~= lastMap then recent=nil; lastMap=map end
    for _,path in ipairs(paths) do
        local target=path
        if not hooks[target] then
            local fn=safe(function() return StaticFindObject(target) end)
            if valid(fn) then
                local ok,pre,post=pcall(RegisterHook,target,function(context)
                    local eventMap=safe(function() return worldName(context:get():GetWorld()) end)
                    if eventMap then
                        recent={map=eventMap,at=os.time()}
                        print('[TKA_RPC] SAVE_EVENT map=' .. eventMap .. ' function=' .. target .. '\n')
                    end
                    -- No return value, no parameter mutation.
                end)
                if ok then hooks[target]={pre,post} end
            end
        end
    end
    local activeInteraction=nil
    -- Direct HUD references were found in real logs. Require a visible viewport
    -- HUD and visible ancestors, rather than mere object existence.
    if valid(hud) then
        M.panels=M.panels or {}
        local appearance=safe(function() return hud['Is Appearance Panel Visible'](hud) end)
        if type(appearance)=='boolean' then
            local key=map .. ':appearance_query'
            if M.panels[key]~=appearance then
                M.panels[key]=appearance
                print('[TKA_RPC] PANEL_OBSERVATION map=' .. map .. ' appearance_query=' .. tostring(appearance) .. '\n')
            end
        end
        local appearancePanel=safe(function() return hud.AppearancePanel end)
        local vendingPanel=safe(function() return hud.VendingPanel end)
        if panelOpen(appearancePanel,hud) then activeInteraction='appearance'
        elseif panelOpen(vendingPanel,hud) then activeInteraction='shop' end
        for _,field in ipairs({'AppearancePanel','VendingPanel','CanvasPanel_CheckPoint'}) do
            local panel=safe(function() return hud[field] end)
            if valid(panel) then
                local visible=safe(function() return panel:IsVisible() end)
                if type(visible)=='boolean' then
                    local key=map .. ':' .. field
                    if M.panels[key]~=visible then
                        M.panels[key]=visible
                        print('[TKA_RPC] PANEL_OBSERVATION map=' .. map .. ' field=' .. field .. ' local_visible=' .. tostring(visible) .. '\n')
                    end
                end
            end
        end
    end
    if M.lastInteraction~=activeInteraction then
        M.lastInteraction=activeInteraction
        print('[TKA_RPC] INTERACTION map=' .. tostring(map) .. ' active=' .. tostring(activeInteraction or 'none') .. '\n')
    end
    if activeInteraction then return activeInteraction end
    if recent and recent.map==map and os.time()-recent.at>=0 and os.time()-recent.at<20 then return 'save' end
    return nil
end
return M
