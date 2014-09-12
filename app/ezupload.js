// Once files have been selected
// '/raw/upload'
function uploadImage(url, image, success, progress)
{
	var canvas = document.createElement('canvas'),
						max_size = 1200,
						width = image.width,
						height = image.height;

   if (width > height) {
		if (width > max_size) {
				height *= max_size / width;
				width = max_size;
		}
	} else {
		if (height > max_size) {
				width *= max_size / height;
				height = max_size;
		}
	}
	canvas.width = width;
	canvas.height = height;
	canvas.getContext('2d').drawImage(image, 0, 0, width, height);
	var xhr = new XMLHttpRequest();
	if (xhr.upload) {
		// Update progress
		xhr.upload.addEventListener('progress', function(event) {
			var percent = parseInt(event.loaded / event.total * 100);
			//progressElement.style.width = percent+'%';
			if(progress){
				progress(percent);
			}
		}, false);
    }
						// File uploaded / failed
	xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						if(success){
							success(xhr.responseText);
						}
					} else {
									//imageElement.parentNode.removeChild(imageElement);
					}
				}
	}

		// Start upload
	xhr.open('post', url, true);
	xhr.send(canvas.toDataURL('image/jpeg'));
}

/**
			//imageElement.classList.remove('uploading');
									//imageElement.classList.add('uploaded');
							Config.head = new Image();

							//imageElement.style.backgroundImage = 'url('+xhr.responseText+')';
							Config.head.src = xhr.responseText;
							Config.head.onload = function(img){
								Config.updateHead(Config.head);
							};
							console.log('Image uploaded: '+xhr.responseText);
**/
