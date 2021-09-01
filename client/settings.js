var settings = {
    inventoryOpen:false,
    craftOpen:false,
};

document.getElementById('inventoryButton').onclick = function(){
    toggleInventory();
}
document.getElementById('craftButton').onclick = function(){
    toggleCraft();
}
openInventory = function(){
    settings.inventoryOpen = true;
    document.getElementById('inventoryBackground').style.display = 'inline-block';
    document.getElementById('inventoryDiv').style.display = 'inline-block';
}
closeInventory = function(){
    settings.inventoryOpen = false;
    document.getElementById('inventoryBackground').style.display = 'none';
    document.getElementById('inventoryDiv').style.display = 'none';
    var rect = document.getElementById('inventoryDiv').getBoundingClientRect();
    if(rawMouseX > rect.left && rawMouseX < rect.right && rawMouseY > rect.top && rawMouseY < rect.bottom){
        var itemMenu = document.getElementById('itemMenu');
        itemMenu.style.display = 'none';
    }
}
toggleInventory = function(){
    settings.inventoryOpen = !settings.inventoryOpen;
    if(settings.inventoryOpen){
        document.getElementById('inventoryBackground').style.display = 'inline-block';
        document.getElementById('inventoryDiv').style.display = 'inline-block';
    }
    else{
        document.getElementById('inventoryBackground').style.display = 'none';
        document.getElementById('inventoryDiv').style.display = 'none';
        var rect = document.getElementById('inventoryDiv').getBoundingClientRect();
        if(rawMouseX > rect.left && rawMouseX < rect.right && rawMouseY > rect.top && rawMouseY < rect.bottom){
            var itemMenu = document.getElementById('itemMenu');
            itemMenu.style.display = 'none';
        }
    }
}
openCraft = function(){
    settings.craftOpen = true;
    document.getElementById('craftBackground').style.display = 'inline-block';
    document.getElementById('craftDiv').style.display = 'inline-block';
}
closeCraft = function(){
    settings.craftOpen = false;
    document.getElementById('craftBackground').style.display = 'none';
    document.getElementById('craftDiv').style.display = 'none';
    var rect = document.getElementById('craftDiv').getBoundingClientRect();
    if(rawMouseX > rect.left && rawMouseX < rect.right && rawMouseY > rect.top && rawMouseY < rect.bottom){
        var itemMenu = document.getElementById('itemMenu');
        itemMenu.style.display = 'none';
    }
}
toggleCraft = function(){
    settings.craftOpen = !settings.craftOpen;
    if(settings.craftOpen){
        document.getElementById('craftBackground').style.display = 'inline-block';
        document.getElementById('craftDiv').style.display = 'inline-block';
    }
    else{
        document.getElementById('craftBackground').style.display = 'none';
        document.getElementById('craftDiv').style.display = 'none';
        var rect = document.getElementById('craftDiv').getBoundingClientRect();
        if(rawMouseX > rect.left && rawMouseX < rect.right && rawMouseY > rect.top && rawMouseY < rect.bottom){
            var itemMenu = document.getElementById('itemMenu');
            itemMenu.style.display = 'none';
        }
    }
}