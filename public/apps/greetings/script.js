

let msgarray=["Welcome!! Hello world!!!","This is selva..."];
let index=0;
let i=0;
let body=document.querySelector('.msg-body p');
function type(){

    if(i<msgarray[index].length){
        document.querySelector('.msg-body p').textContent += msgarray[index][i];
    i++;
    setTimeout(type, 100);
    }
    else{
        setTimeout(wait, 1000); 
    }
    
}
function wait(){
    if(i>=0){
        i--;
        document.querySelector('.msg-body p').textContent=msgarray[index].substring(0,i);
        
        setTimeout(wait, 50);
    }
    else{
        index++;
        if(index>=msgarray.length) index=0;
        i=0;
        setTimeout(type,1000);
    }

}
document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('msgi').addEventListener('click',() => {
        document.querySelector('.msg').style.display = 'none';
        document.querySelector('.msg~p').style.display = 'none';
        document.querySelector('.msg-body').style.display = 'flex';
        type();
        
    });
});
