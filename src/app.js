window.addEventListener('load', function(){
	var content = document.getElementById('content');
	var p = document.createElement('p');
	p.innerHTML = new Date().toString();
	content.appendChild(p);
},false);
