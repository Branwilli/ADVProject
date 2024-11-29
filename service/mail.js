function sendEmail() {
    let params ={
         to_name : document.getElementById('receiver_email').value,
         from_name : document.getElementById('sender_email').value,
         subject : document.getElementById('subject').value,
         message : document.getElementById('messageBox').value,
    }
    emailjs.send("service_44kcbr1","template_rb10vxj", params).then(alert("Email Sent"));
 }
 