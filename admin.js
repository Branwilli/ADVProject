$(document).ready(function(){
    res = document.querySelector("#content");
    const collection = document.getElementByClassName("sidenav").children;

    collection[1].addEventListener("click", (e)=>{
        e.preventDefault();
        const url = '';

        fetch(url, {
            method: 'GET',
        })
        .then(function(responseText){
            if (responseText.ok) {
                return (responseText.text());
            } else{
                alert("Error.");
                Promise.reject();
                console.log("Failed");
            }
        })
        .then(function(d){
            console.log(d);
            res.innerHTML=d;
        })


        /*.then(response => response.json())
        .then(data => {
            console.log(data);

            let output = "<table><tr><th> ID </th><th>Client's Name</th><th>Email</th><th>Status</th></tr>";
            data.forEach(row => {
                output += `<tr><td>${row.id}</td><td>${row.name}</td><td>${row.email}</td><td>${row.status}</td></tr>`;
            });
            output += "</table>";
        })*/
    });

   $(clientSearch).click(function(e){
    e.preventDefault();

    rawInp = document.getElementById("clientSearch").nodeValue;
    vari = rawInp.replace(/[^a-z0-9\s]/gi, '');
    //res = document.querySelector("#content");

    fetch(''+''+vari, {
        method:'GET',
        })
        .then(function(responseText){
            if (responseText.ok) {
                return(responseText.text());
            }else{
                alert("Error.");
                Promise.reject();
                console.log("Failed.")
            }
        })
        .then(function(d){
            console.log(d);
            res.innerHTML=d;
        })
   }); 
});
