// Debug script to test button state issue
// Run this in browser console after loading the profile page

console.log('=== BUTTON STATE DEBUG SCRIPT ===');

// Function to check component state
function checkComponentState() {
    // Try to find the Angular component instance
    const profileComponent = document.querySelector('app-profile');
    
    if (profileComponent) {
        console.log('Profile component found:', profileComponent);
        
        // Try to access Angular component instance
        const ngComponent = ng.getComponent(profileComponent);
        if (ngComponent) {
            console.log('Angular component instance:', ngComponent);
            console.log('selectedFile:', ngComponent.selectedFile);
            console.log('isUploading:', ngComponent.isUploading);
            console.log('Button should be disabled:', !ngComponent.selectedFile || ngComponent.isUploading);
        } else {
            console.log('Could not access Angular component instance');
        }
    } else {
        console.log('Profile component not found');
    }
}

// Function to check file input state
function checkFileInputState() {
    const fileInput = document.getElementById('picture');
    if (fileInput) {
        console.log('File input found:', fileInput);
        console.log('File input files:', fileInput.files);
        console.log('File input value:', fileInput.value);
        
        if (fileInput.files && fileInput.files.length > 0) {
            console.log('File selected:', fileInput.files[0]);
        } else {
            console.log('No file selected in input');
        }
    } else {
        console.log('File input not found');
    }
}

// Function to check button state
function checkButtonState() {
    const buttons = document.querySelectorAll('.upload-btn');
    console.log('Upload buttons found:', buttons.length);
    
    buttons.forEach((button, index) => {
        console.log(`Button ${index + 1}:`, {
            disabled: button.disabled,
            textContent: button.textContent?.trim(),
            classList: Array.from(button.classList)
        });
    });
}

// Function to simulate file selection
function simulateFileSelection() {
    console.log('Simulating file selection...');
    
    const fileInput = document.getElementById('picture');
    if (fileInput) {
        // Create a fake file
        const fakeFile = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
        
        // Create a new FileList with the fake file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(fakeFile);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
        
        console.log('File selection simulated');
        
        // Check state after simulation
        setTimeout(() => {
            console.log('State after simulation:');
            checkComponentState();
            checkButtonState();
        }, 100);
    }
}

// Main debug function
function debugButtonState() {
    console.log('Starting button state debug...');
    
    console.log('\n1. Checking component state:');
    checkComponentState();
    
    console.log('\n2. Checking file input state:');
    checkFileInputState();
    
    console.log('\n3. Checking button state:');
    checkButtonState();
    
    console.log('\n4. Simulating file selection:');
    simulateFileSelection();
}

// Auto-run debug
debugButtonState();

// Make functions available globally for manual testing
window.debugButtonState = debugButtonState;
window.checkComponentState = checkComponentState;
window.checkFileInputState = checkFileInputState;
window.checkButtonState = checkButtonState;
window.simulateFileSelection = simulateFileSelection;

console.log('\n=== DEBUG FUNCTIONS AVAILABLE ===');
console.log('Run these in console:');
console.log('- debugButtonState() - Full debug check');
console.log('- checkComponentState() - Check Angular component');
console.log('- checkFileInputState() - Check file input');
console.log('- checkButtonState() - Check button state');
console.log('- simulateFileSelection() - Simulate file selection');
console.log('=== END DEBUG SCRIPT ===');
