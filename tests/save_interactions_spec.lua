package.path='./TKA_RPC/Scripts/?.lua;'..package.path
local clock=100
os.time=function() return clock end
local callbacks={}
StaticFindObject=function() return {IsValid=function() return true end} end
RegisterHook=function(path,callback) callbacks[path]=callback; return 1,2 end
local function world(name) return {IsValid=function() return true end,GetFName=function() return {ToString=function() return name end} end} end
local first,second=world('Level_1'),world('Level_2')
local module=require('Interactions')
assert(module.sample(first,nil)==nil)
local count=0
for _,cb in pairs(callbacks) do
    count=count+1
    assert(cb({get=function() return {GetWorld=function() return first end} end})==nil,'Hook overrides return')
end
assert(count==2)
assert(module.sample(first,nil)=='save')
clock=119; assert(module.sample(first,nil)=='save')
clock=120; assert(module.sample(first,nil)==nil)
for _,cb in pairs(callbacks) do cb({get=function() return {GetWorld=function() return first end} end}) end
assert(module.sample(second,nil)==nil,'Save leaked into next map')
assert(module.sample(first,nil)==nil,'Old save resurrected after travel')
local function widget(visible,parent)
    return {IsValid=function() return true end,IsVisible=function() return visible end,GetParent=function() return parent end}
end
local hiddenParent=widget(false,nil)
local hud=widget(true,nil)
hud.IsInViewport=function() return true end
hud.AppearancePanel=widget(true,hiddenParent)
assert(module.sample(first,hud)==nil,'Hidden ancestor caused false appearance state')
hud.AppearancePanel=widget(true,nil)
assert(module.sample(first,hud)=='appearance')
hud.IsInViewport=function() return false end
assert(module.sample(first,hud)==nil,'Detached HUD caused false appearance state')
hud.IsInViewport=function() return true end
hud.AppearancePanel=widget(false,nil)
hud.VendingPanel=widget(true,nil)
assert(module.sample(first,hud)=='shop')
hud.VendingPanel=widget(false,nil)
assert(module.sample(first,hud)==nil,'Shop remained active after close')
print('PASS: real save entrypoints, no return override, 20-second expiry, map isolation')
print('PASS: wardrobe/shop opening and closing, hidden ancestors and detached HUD ignored')
