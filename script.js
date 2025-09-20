// Global variables
let currentStep = 1;
let currentDeceasedStep = 1;
let map;
let donors = [];
let deceasedDonors = [];
let searchResults = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be available
    const checkFirebase = setInterval(() => {
        if (window.firebaseDatabase) {
            clearInterval(checkFirebase);
            initializeApp();
        }
    }, 100);
    
    // Add test search functionality for debugging
    window.testSearch = function() {
        console.log('Testing search functionality...');
        console.log('Donors available:', donors);
        
        // Test search for heart
        const testResults = donors.filter(donor => 
            donor.organs && donor.organs.includes('heart')
        );
        console.log('Test search for heart:', testResults);
        
        // Update the search organ dropdown to heart and trigger search
        document.getElementById('searchOrgan').value = 'heart';
        searchDonors();
    };
    
    // Add refresh data functionality
    window.refreshData = async function() {
        console.log('Refreshing data from Firebase...');
        try {
            await loadDataFromFirebase();
            console.log('Data refreshed successfully');
            alert('Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            alert('Error refreshing data. Please try again.');
        }
    };
    
    // Add debug function
    window.debugData = function() {
        console.log('=== DEBUG DATA ===');
        console.log('Living donors:', donors);
        console.log('Deceased donors:', deceasedDonors);
        console.log('Total living:', donors.length);
        console.log('Total deceased:', deceasedDonors.length);
        console.log('Firebase available:', !!window.firebaseDatabase);
        console.log('==================');
        alert(`Debug Info:\nLiving Donors: ${donors.length}\nDeceased Donors: ${deceasedDonors.length}\nFirebase: ${window.firebaseDatabase ? 'Available' : 'Not Available'}`);
    };
});

function initializeApp() {
    // Initialize navigation
    initializeNavigation();
    
    // Initialize form
    initializeForm();
    
    // Initialize deceased form
    initializeDeceasedForm();
    
    // Initialize map
    initializeMap();
    
    // Load data from Firebase
    loadDataFromFirebase();
    
    // Initialize scroll animations
    initializeScrollAnimations();
}

// Firebase helper functions
async function saveToFirebase(path, data) {
    try {
        const database = window.firebaseDatabase;
        const ref = window.firebaseRef;
        const push = window.firebasePush;
        const set = window.firebaseSet;
        
        const dataRef = ref(database, path);
        const newRef = push(dataRef);
        await set(newRef, data);
        return newRef.key;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        throw error;
    }
}

async function getFromFirebase(path) {
    try {
        const database = window.firebaseDatabase;
        const ref = window.firebaseRef;
        const get = window.firebaseGet;
        
        const dataRef = ref(database, path);
        const snapshot = await get(dataRef);
        return snapshot.val();
    } catch (error) {
        console.error('Error getting from Firebase:', error);
        throw error;
    }
}

async function loadDataFromFirebase() {
    try {
        // Load living donors
        const livingDonorsData = await getFromFirebase('livingDonors');
        if (livingDonorsData) {
            donors = Object.values(livingDonorsData);
            console.log('Loaded living donors from Firebase:', donors);
        } else {
            // Load sample data if no data exists
            await loadSampleData();
        }
        
        // Load deceased donors
        const deceasedDonorsData = await getFromFirebase('deceasedDonors');
        if (deceasedDonorsData) {
            deceasedDonors = Object.values(deceasedDonorsData);
            console.log('Loaded deceased donors from Firebase:', deceasedDonors);
        } else {
            // Load sample data if no data exists
            await loadDeceasedDonors();
        }
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        // Fallback to localStorage
        loadSampleData();
        loadDeceasedDonors();
    }
}

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Form functionality
function initializeForm() {
    const form = document.getElementById('donorForm');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Form validation
    form.addEventListener('input', validateCurrentStep);
    
    // Step navigation
    nextBtn.addEventListener('click', function() {
        if (validateCurrentStep()) {
            changeStep(1);
        }
    });

    prevBtn.addEventListener('click', function() {
        changeStep(-1);
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
}

// Deceased form functionality
function initializeDeceasedForm() {
    const form = document.getElementById('deceasedForm');
    const nextBtn = document.getElementById('deceasedNextBtn');
    const prevBtn = document.getElementById('deceasedPrevBtn');
    const submitBtn = document.getElementById('deceasedSubmitBtn');

    // Form validation
    form.addEventListener('input', validateCurrentDeceasedStep);
    
    // Step navigation
    nextBtn.addEventListener('click', function() {
        if (validateCurrentDeceasedStep()) {
            changeDeceasedStep(1);
        }
    });

    prevBtn.addEventListener('click', function() {
        changeDeceasedStep(-1);
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitDeceasedForm();
    });
}

function changeDeceasedStep(direction) {
    const steps = document.querySelectorAll('#deceasedForm .form-step');
    const totalSteps = steps.length;
    
    // Hide current step
    steps[currentDeceasedStep - 1].classList.remove('active');
    
    // Calculate new step
    currentDeceasedStep += direction;
    
    // Ensure step is within bounds
    if (currentDeceasedStep < 1) currentDeceasedStep = 1;
    if (currentDeceasedStep > totalSteps) currentDeceasedStep = totalSteps;
    
    // Show new step
    steps[currentDeceasedStep - 1].classList.add('active');
    
    // Update navigation buttons
    updateDeceasedStepNavigation();
}

function updateDeceasedStepNavigation() {
    const prevBtn = document.getElementById('deceasedPrevBtn');
    const nextBtn = document.getElementById('deceasedNextBtn');
    const submitBtn = document.getElementById('deceasedSubmitBtn');
    const totalSteps = document.querySelectorAll('#deceasedForm .form-step').length;
    
    // Show/hide previous button
    prevBtn.style.display = currentDeceasedStep === 1 ? 'none' : 'inline-block';
    
    // Show/hide next/submit button
    if (currentDeceasedStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function validateCurrentDeceasedStep() {
    const currentStepElement = document.querySelector(`#deceasedForm .form-step[data-step="${currentDeceasedStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (field.type === 'checkbox') {
            const checkboxes = currentStepElement.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(checkboxes).some(cb => cb.checked);
            if (!isChecked) {
                showFieldError(field, 'Please select at least one donated organ/tissue');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (field.type === 'tel') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                showFieldError(field, 'Please enter a valid phone number');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

async function submitDeceasedForm() {
    if (!validateCurrentDeceasedStep()) {
        return;
    }
    
    const formData = new FormData(document.getElementById('deceasedForm'));
    const deceasedData = {};
    
    // Collect form data
    for (let [key, value] of formData.entries()) {
        if (key === 'donatedOrgans') {
            if (!deceasedData[key]) deceasedData[key] = [];
            deceasedData[key].push(value);
        } else {
            deceasedData[key] = value;
        }
    }
    
    // Add timestamp and type
    deceasedData.timestamp = new Date().toISOString();
    deceasedData.type = 'deceased';
    
    try {
        // Show loading state
        const submitBtn = document.getElementById('deceasedSubmitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Saving...';
        submitBtn.disabled = true;
        
        // Save to Firebase
        const deceasedId = await saveToFirebase('deceasedDonors', deceasedData);
        deceasedData.id = deceasedId;
        
        // Update local array
        deceasedDonors.push(deceasedData);
        
        // Show success modal
        showDeceasedSuccessModal();
        
        // Reset form
        document.getElementById('deceasedForm').reset();
        currentDeceasedStep = 1;
        changeDeceasedStep(0);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error saving deceased donor:', error);
        alert('Error saving deceased donor information. Please try again.');
        
        // Reset button
        const submitBtn = document.getElementById('deceasedSubmitBtn');
        submitBtn.innerHTML = 'Register Deceased Donor';
        submitBtn.disabled = false;
    }
}

function showDeceasedSuccessModal() {
    const modal = document.getElementById('successModal');
    const modalHeader = modal.querySelector('.modal-header');
    const modalBody = modal.querySelector('.modal-body');
    
    modalHeader.innerHTML = `
        <i class="fas fa-heart"></i>
        <h2>Deceased Donor Registered!</h2>
    `;
    
    modalBody.innerHTML = `
        <p>Thank you for registering the deceased donor. Their donated organs are now available for those in need.</p>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function changeStep(direction) {
    const steps = document.querySelectorAll('.form-step');
    const totalSteps = steps.length;
    
    // Hide current step
    steps[currentStep - 1].classList.remove('active');
    
    // Calculate new step
    currentStep += direction;
    
    // Ensure step is within bounds
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;
    
    // Show new step
    steps[currentStep - 1].classList.add('active');
    
    // Update navigation buttons
    updateStepNavigation();
}

function updateStepNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const totalSteps = document.querySelectorAll('.form-step').length;
    
    // Show/hide previous button
    prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
    
    // Show/hide next/submit button
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (field.type === 'checkbox') {
            const checkboxes = currentStepElement.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(checkboxes).some(cb => cb.checked);
            if (!isChecked) {
                showFieldError(field, 'Please select at least one body part/organ for donation');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (field.type === 'tel') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
                showFieldError(field, 'Please enter a valid phone number');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        } else if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#e74c3c';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#e1e5e9';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

async function submitForm() {
    if (!validateCurrentStep()) {
        return;
    }
    
    const formData = new FormData(document.getElementById('donorForm'));
    const donorData = {};
    
    // Collect form data
    for (let [key, value] of formData.entries()) {
        if (key === 'organs') {
            if (!donorData[key]) donorData[key] = [];
            donorData[key].push(value);
        } else {
            donorData[key] = value;
        }
    }
    
    // Add timestamp and type
    donorData.timestamp = new Date().toISOString();
    donorData.type = 'living';
    
    try {
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Saving...';
        submitBtn.disabled = true;
        
        // Save to Firebase
        const donorId = await saveToFirebase('livingDonors', donorData);
        donorData.id = donorId;
        
        // Update local array
        donors.push(donorData);
        
        // Show success modal
        showSuccessModal();
        
        // Reset form
        document.getElementById('donorForm').reset();
        currentStep = 1;
        changeStep(0);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error saving donor:', error);
        alert('Error saving donor information. Please try again.');
        
        // Reset button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = 'Submit Registration';
        submitBtn.disabled = false;
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Map functionality
function initializeMap() {
    // Initialize map centered on a default location
    map = L.map('map').setView([40.7128, -74.0060], 10);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add click handler for coordinate input
    map.on('click', function(e) {
        const coords = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
        document.getElementById('coordinates').value = coords;
    });
}

// Search functionality
async function searchDonors() {
    const organ = document.getElementById('searchOrgan').value;
    const bloodType = document.getElementById('searchBloodType').value;
    const location = document.getElementById('searchLocation').value;
    const radius = parseInt(document.getElementById('searchRadius').value);
    
    console.log('Search initiated with:', { organ, bloodType, location, radius });
    console.log('Current donors array:', donors);
    console.log('Current deceased donors array:', deceasedDonors);
    
    if (!organ) {
        alert('Please select an organ to search for');
        return;
    }
    
    // Show loading state
    const searchBtn = document.querySelector('.search-filters .btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<span class="loading"></span> Searching...';
    searchBtn.disabled = true;
    
    try {
        // Perform search
        await performSearch(organ, bloodType, location, radius);
    } catch (error) {
        console.error('Search error:', error);
        alert('Error performing search. Please try again.');
    } finally {
        // Reset button
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

async function performSearch(organ, bloodType, location, radius) {
    console.log('Searching with:', { organ, bloodType, location, radius });
    console.log('Available living donors:', donors);
    console.log('Available deceased donors:', deceasedDonors);
    
    // If no data is loaded, try to load it first
    if (donors.length === 0 && deceasedDonors.length === 0) {
        console.log('No data loaded, attempting to load from Firebase...');
        await loadDataFromFirebase();
    }
    
    // Search living donors
    const livingResults = donors.filter(donor => {
        // Check if donor has the required organ
        if (!donor.organs || !donor.organs.includes(organ)) {
            return false;
        }
        
        // Check blood type compatibility if specified
        if (bloodType && donor.bloodType !== bloodType) {
            return false;
        }
        
        // Check location if specified
        if (location) {
            const donorLocation = `${donor.city}, ${donor.state}, ${donor.country}`.toLowerCase();
            if (!donorLocation.includes(location.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
    
    // Search deceased donors
    const deceasedResults = deceasedDonors.filter(donor => {
        // Check if donor has the required organ
        if (!donor.donatedOrgans || !donor.donatedOrgans.includes(organ)) {
            return false;
        }
        
        // Check blood type compatibility if specified
        if (bloodType && donor.deceasedBloodType !== bloodType) {
            return false;
        }
        
        // Check location if specified
        if (location) {
            const donorLocation = `${donor.deceasedCity}, ${donor.deceasedState}, ${donor.deceasedCountry}`.toLowerCase();
            if (!donorLocation.includes(location.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
    
    // Combine results
    searchResults = [...livingResults, ...deceasedResults];
    
    console.log('Search results:', searchResults);
    console.log('Living results:', livingResults);
    console.log('Deceased results:', deceasedResults);
    displaySearchResults();
    updateMap();
}

function displaySearchResults() {
    const resultsList = document.getElementById('resultsList');
    
    console.log('Displaying search results:', searchResults);
    console.log('Number of results:', searchResults.length);
    
    if (searchResults.length === 0) {
        resultsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No donors found</h3>
                <p>Try adjusting your search criteria or expanding your search radius</p>
                <p><small>Total donors in database: ${donors.length + deceasedDonors.length}</small></p>
            </div>
        `;
        return;
    }
    
    resultsList.innerHTML = searchResults.map(donor => {
        if (donor.type === 'deceased') {
            return `
                <div class="donor-card deceased-card" onclick="selectDonor('${donor.id}')">
                    <div class="donor-type-badge deceased-badge">
                        <i class="fas fa-heart"></i> Deceased Donor
                    </div>
                    <h4>${donor.deceasedName} (Deceased)</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${donor.deceasedCity}, ${donor.deceasedState}, ${donor.deceasedCountry}</p>
                    <p><i class="fas fa-tint"></i> Blood Type: ${donor.deceasedBloodType}</p>
                    <p><i class="fas fa-hospital"></i> ${donor.deceasedHospitalName}</p>
                    <p><i class="fas fa-phone"></i> ${donor.deceasedContact} (${donor.relationship})</p>
                    <p><i class="fas fa-calendar"></i> Donated: ${new Date(donor.donationDate).toLocaleDateString()}</p>
                    <div class="organs">
                        ${donor.donatedOrgans.map(organ => `<span class="organ-tag deceased-organ">${organ}</span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="donor-card living-card" onclick="selectDonor('${donor.id}')">
                    <div class="donor-type-badge living-badge">
                        <i class="fas fa-user-heart"></i> Living Donor
                    </div>
                    <h4>${donor.donorName}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${donor.city}, ${donor.state}, ${donor.country}</p>
                    <p><i class="fas fa-tint"></i> Blood Type: ${donor.bloodType}</p>
                    <p><i class="fas fa-hospital"></i> ${donor.hospitalName}</p>
                    <p><i class="fas fa-phone"></i> ${donor.donorContact}</p>
                    <div class="organs">
                        ${donor.organs.map(organ => `<span class="organ-tag living-organ">${organ}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }).join('');
}

function updateMap() {
    // Clear existing markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    // Add markers for search results
    searchResults.forEach(donor => {
        if (donor.coordinates) {
            const [lat, lng] = donor.coordinates.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`
                    <strong>${donor.donorName}</strong><br>
                    ${donor.hospitalName}<br>
                    Blood Type: ${donor.bloodType}<br>
                    Available: ${donor.organs.join(', ')}
                `);
            }
        }
    });
    
    // Fit map to show all markers
    if (searchResults.length > 0) {
        const group = new L.featureGroup();
        searchResults.forEach(donor => {
            if (donor.coordinates) {
                const [lat, lng] = donor.coordinates.split(',').map(coord => parseFloat(coord.trim()));
                if (!isNaN(lat) && !isNaN(lng)) {
                    group.addLayer(L.marker([lat, lng]));
                }
            }
        });
        if (group.getLayers().length > 0) {
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function selectDonor(donorId) {
    const donor = searchResults.find(d => d.id === donorId);
    if (donor) {
        if (donor.type === 'deceased') {
            alert(`Deceased Donor Information:\nName: ${donor.deceasedName} (Deceased)\nContact: ${donor.deceasedContact} (${donor.relationship})\nEmail: ${donor.deceasedEmail}\nHospital: ${donor.deceasedHospitalName}\nDonation Date: ${new Date(donor.donationDate).toLocaleDateString()}\nAvailable Organs: ${donor.donatedOrgans.join(', ')}`);
        } else {
            alert(`Living Donor Information:\nName: ${donor.donorName}\nPhone: ${donor.donorContact}\nEmail: ${donor.donorEmail}\nHospital: ${donor.hospitalName}\nAvailable Organs: ${donor.organs.join(', ')}`);
        }
    }
}

// Sample data
async function loadSampleData() {
    try {
        // Load sample data
        const sampleDonors = [
            {
                donorName: 'John Smith',
                donorAge: '35',
                donorBloodType: 'O+',
                donorContact: '+1-555-0123',
                donorEmail: 'john.smith@email.com',
                organs: ['heart', 'liver', 'kidney'],
                hospitalName: 'City General Hospital',
                hospitalContact: '+1-555-0100',
                country: 'US',
                state: 'New York',
                district: 'Manhattan',
                city: 'New York',
                streetAddress: '123 Medical Ave',
                postalCode: '10001',
                coordinates: '40.7589, -73.9851',
                timestamp: new Date().toISOString(),
                type: 'living'
            },
            {
                donorName: 'Sarah Johnson',
                donorAge: '28',
                donorBloodType: 'A+',
                donorContact: '+1-555-0124',
                donorEmail: 'sarah.johnson@email.com',
                organs: ['cornea', 'skin', 'bone'],
                hospitalName: 'Metro Health Center',
                hospitalContact: '+1-555-0101',
                country: 'US',
                state: 'California',
                district: 'Los Angeles',
                city: 'Los Angeles',
                streetAddress: '456 Health Blvd',
                postalCode: '90210',
                coordinates: '34.0522, -118.2437',
                timestamp: new Date().toISOString(),
                type: 'living'
            },
            {
                donorName: 'Michael Brown',
                donorAge: '42',
                donorBloodType: 'B+',
                donorContact: '+1-555-0125',
                donorEmail: 'michael.brown@email.com',
                organs: ['lungs', 'pancreas'],
                hospitalName: 'Regional Medical Center',
                hospitalContact: '+1-555-0102',
                country: 'US',
                state: 'Texas',
                district: 'Harris',
                city: 'Houston',
                streetAddress: '789 Care Street',
                postalCode: '77001',
                coordinates: '29.7604, -95.3698',
                timestamp: new Date().toISOString(),
                type: 'living'
            }
        ];
        
        // Save sample data to Firebase
        for (const donor of sampleDonors) {
            const donorId = await saveToFirebase('livingDonors', donor);
            donor.id = donorId;
        }
        
        donors = sampleDonors;
        console.log('Created sample donors in Firebase:', donors);
    } catch (error) {
        console.error('Error creating sample data:', error);
    }
}

async function loadDeceasedDonors() {
    try {
        // Load sample deceased donor data
        const sampleDeceasedDonors = [
            {
                deceasedName: 'Robert Wilson',
                deceasedAge: '65',
                deceasedBloodType: 'O-',
                deceasedContact: '+1-555-0200',
                deceasedEmail: 'family.wilson@email.com',
                relationship: 'spouse',
                donatedOrgans: ['heart', 'liver', 'cornea'],
                donationDate: '2024-01-15',
                deceasedHospitalName: 'Memorial Hospital',
                deceasedHospitalContact: '+1-555-0201',
                deceasedCountry: 'US',
                deceasedState: 'Florida',
                deceasedDistrict: 'Miami-Dade',
                deceasedCity: 'Miami',
                deceasedStreetAddress: '789 Memorial Drive',
                deceasedPostalCode: '33101',
                deceasedCoordinates: '25.7617, -80.1918',
                timestamp: new Date().toISOString(),
                type: 'deceased'
            },
            {
                deceasedName: 'Maria Garcia',
                deceasedAge: '45',
                deceasedBloodType: 'A+',
                deceasedContact: '+1-555-0202',
                deceasedEmail: 'garcia.family@email.com',
                relationship: 'daughter',
                donatedOrgans: ['kidney', 'pancreas', 'skin'],
                donationDate: '2024-02-10',
                deceasedHospitalName: 'General Medical Center',
                deceasedHospitalContact: '+1-555-0203',
                deceasedCountry: 'US',
                deceasedState: 'Texas',
                deceasedDistrict: 'Dallas',
                deceasedCity: 'Dallas',
                deceasedStreetAddress: '456 Medical Blvd',
                deceasedPostalCode: '75201',
                deceasedCoordinates: '32.7767, -96.7970',
                timestamp: new Date().toISOString(),
                type: 'deceased'
            }
        ];
        
        // Save sample data to Firebase
        for (const donor of sampleDeceasedDonors) {
            const donorId = await saveToFirebase('deceasedDonors', donor);
            donor.id = donorId;
        }
        
        deceasedDonors = sampleDeceasedDonors;
        console.log('Created sample deceased donors in Firebase:', deceasedDonors);
    } catch (error) {
        console.error('Error creating sample deceased data:', error);
    }
}

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.section-header, .feature, .donor-card').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatPhone(phone) {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Handle form step indicators (optional enhancement)
function updateStepIndicators() {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add loading states and error handling
function showLoading(element) {
    element.innerHTML = '<span class="loading"></span> Loading...';
    element.disabled = true;
}

function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Add form auto-save functionality
function autoSaveForm() {
    const form = document.getElementById('donorForm');
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem('donorFormDraft', JSON.stringify(data));
}

// Load form draft on page load
function loadFormDraft() {
    const draft = localStorage.getItem('donorFormDraft');
    if (draft) {
        const data = JSON.parse(draft);
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
    }
}

// Initialize auto-save
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('donorForm');
    if (form) {
        form.addEventListener('input', autoSaveForm);
        loadFormDraft();
    }
});

// Clear form draft on successful submission
function clearFormDraft() {
    localStorage.removeItem('donorFormDraft');
}

// Update submitForm to clear draft
const originalSubmitForm = submitForm;
submitForm = function() {
    originalSubmitForm();
    clearFormDraft();
};
