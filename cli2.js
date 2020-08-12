const data=require('speedtest2');

function tre(){
    data({
        progress: event => {
          const content = event;
          return content;
          //console.log(content);
        }
     });
}

module.exports=tre;
