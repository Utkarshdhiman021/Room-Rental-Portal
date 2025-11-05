console.log("file.js loaded successfully");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    const landing = document.getElementById('landing');
    const landlordSection = document.getElementById('landlordSection');
    const renterSection = document.getElementById('renterSection');
    const landlordBtn = document.getElementById('landlordBtn');
    const renterBtn = document.getElementById('renterBtn');
    const landlordBackBtn = document.getElementById('landlordBackBtn');
    const renterBackBtn = document.getElementById('renterBackBtn');

    const roomForm = document.getElementById('roomForm');
    const listingsDiv = document.getElementById('listings');

    const searchCity = document.getElementById('searchCity');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    const imagePopupOverlay = document.getElementById('imagePopupOverlay');
    const popupImage = document.getElementById('popupImage');
    const closePopupBtn = document.getElementById('closePopupBtn');

    // Menu elements
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    // Ensure popup hidden and cleared on load
    imagePopupOverlay.classList.add('hidden');
    popupImage.src = "";

    const ROOMS_KEY = 'roomPortalRooms';
    let currentUser = null;
    let editIndex = null;

    // Function to resize image for compression
    function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // Base64 helper with compression
    async function fileToBase64(file) {
        try {
            const resizedBlob = await resizeImage(file);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                reader.readAsDataURL(resizedBlob);
            });
        } catch (error) {
            throw new Error(`Failed to compress and convert file: ${file.name}`);
        }
    }

    function getRooms() {
        try {
            return JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];
        } catch (e) {
            console.error("Error loading rooms from localStorage:", e);
            return [];
        }
    }

    function saveRooms(rooms) {
        try {
            const data = JSON.stringify(rooms);
            if (data.length > 4 * 1024 * 1024) { // ~4MB limit check
                throw new Error("Data too large for localStorage.");
            }
            localStorage.setItem(ROOMS_KEY, data);
        } catch (e) {
            console.error("Error saving rooms to localStorage:", e);
            alert("Failed to save room. Data too large or localStorage full. Try fewer/smaller images.");
            throw e; // Re-throw to prevent posting
        }
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem("users")) || [];
        } catch (e) {
            console.error("Error loading users from localStorage:", e);
            return [];
        }
    }

    function saveUsers(users) {
        try {
            localStorage.setItem("users", JSON.stringify(users));
        } catch (e) {
            console.error("Error saving users to localStorage:", e);
            alert("Failed to save user data.");
        }
    }

    function checkLogin() {
        const loggedInUser = localStorage.getItem("loggedInUser");
        if(!loggedInUser){
            alert("You must log in first!");
            window.location.href = "log.html";
            return false;
        }
        currentUser = { email: loggedInUser };
        console.log("Logged in as:", currentUser.email);
        return true;
    }

    if(!checkLogin()) return;

    // Menu button toggle
    menuBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem("loggedInUser");
        alert("Logged out successfully!");
        window.location.href = "log.html";
    });

    // Delete account
    deleteAccountBtn.addEventListener('click', () => {
        const password = prompt("Enter your password to confirm account deletion:");
        if (!password) return;

        const users = getUsers();
        const userIndex = users.findIndex(user => user.id === currentUser.email && user.pass === password);
        if (userIndex === -1) {
            alert("Incorrect password. Account deletion cancelled.");
            return;
        }

        // Delete user
        users.splice(userIndex, 1);
        saveUsers(users);

        // Delete all rooms by this user
        const rooms = getRooms().filter(room => room.email !== currentUser.email);
        saveRooms(rooms);

        // Logout
        localStorage.removeItem("loggedInUser");
        alert("Account and all associated posts deleted successfully!");
        window.location.href = "log.html";
    });

    landlordBtn.addEventListener('click', () => {
        landing.classList.add('hidden');
        landlordSection.classList.remove('hidden');
    });

    renterBtn.addEventListener('click', () => {
        landing.classList.add('hidden');
        renterSection.classList.remove('hidden');
        displayRooms();
    });

    landlordBackBtn.addEventListener('click', () => {
        landlordSection.classList.add('hidden');
        landing.classList.remove('hidden');
    });

    renterBackBtn.addEventListener('click', () => {
        renterSection.classList.add('hidden');
        landing.classList.remove('hidden');
    });

    // Room form submission with compression, size check, and loading animation
    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted");

        const submitBtn = document.querySelector('#roomForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled = true;

        try {
            const rooms = getRooms();
            const imageFiles = document.getElementById('images').files;
            let images = [];

            if (imageFiles.length > 0) {
                try {
                    console.log("Compressing and converting images...");
                    images = await Promise.all([...imageFiles].map(fileToBase64));
                    console.log("Images processed");
                } catch (error) {
                    console.error("Error processing images:", error);
                    alert("Failed to process images. Posting without images.");
                    images = []; // Post without images
                }
            }

            const room = {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                pincode: document.getElementById('pincode').value,
                size: document.getElementById('size').value,
                rent: document.getElementById('rent').value,
                fixtures: document.getElementById('Fixtures').value,
                facility: document.getElementById('facility').value,
                wifi: document.getElementById('wifi').value,
                email: currentUser.email,
                images: images,
                active: true
            };

            // Check total size before saving
            const testData = JSON.stringify([...rooms, room]);
            if (testData.length > 4 * 1024 * 1024) { // ~4MB
                alert("Room data too large. Try fewer or smaller images.");
                return;
            }

            if(editIndex !== null){
                rooms[editIndex] = room;
                editIndex = null;
                alert('Room updated successfully!');
                console.log("Room updated");
            } else {
                rooms.push(room);
                alert('Room posted successfully!');
                console.log("Room posted");
            }

            saveRooms(rooms);
            roomForm.reset();
            displayRooms();
        } catch (error) {
            console.error("Error posting room:", error);
            alert("Failed to post room. Please try again.");
        } finally {
            // Reset button
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Room';
            submitBtn.disabled = false;
        }
    });

    function displayRooms(filteredRooms = null){
        const rooms = filteredRooms || getRooms();
        listingsDiv.innerHTML = '';
        if(rooms.length === 0){
            listingsDiv.innerHTML = '<p>No rooms available.</p>';
            return;
        }

        rooms.forEach((room, index) => {
            const roomDiv = document.createElement('div');
            roomDiv.classList.add('listing');
            if(!room.active) roomDiv.style.opacity = '0.6';

            let imagesHTML = '';
            if(room.images.length > 0){
                imagesHTML = `<div class="images-row">` + room.images.map(img => {
                    return `<img src="${img}" alt="room image" class="clickable-image">`;
                }).join('') + `</div>`;
            }

            let buttonsHTML = '';
            if(room.email === currentUser.email){
                buttonsHTML = `
                    <button class="updateBtn" data-index="${index}">Update</button>
                    <button class="deleteBtn" data-index="${index}">Delete</button>
                    <button class="toggleBtn" data-index="${index}">${room.active ? 'Pause' : 'Resume'}</button>
                `;
            }

            roomDiv.innerHTML = `
                <p><strong>Address:</strong> ${room.address}</p>
                <p><strong>City:</strong> ${room.city}</p>
                <p><strong>Pin Code:</strong> ${room.pincode}</p>
                <p><strong>Size:</strong> ${room.size} sq ft</p>
                <p><strong>Rent:</strong> ₹${room.rent}</p>
                <p><strong>Fixtures:</strong> ${room.fixtures}</p>
                <p><strong>Facility:</strong> ${room.facility}</p>
                <p><strong>WiFi:</strong> ${room.wifi}</p>
                <p><strong>Posted by:</strong> ${room.email}</p>
                ${imagesHTML}
                <div>${buttonsHTML}</div>
            `;
            listingsDiv.appendChild(roomDiv);
        });

        attachDynamicButtons();
        attachImageClickEvents();
    }

    function attachDynamicButtons(){
        const rooms = getRooms();

        document.querySelectorAll('.updateBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.getAttribute('data-index');
                const room = rooms[index];
                editIndex = index;

                document.getElementById('address').value = room.address;
                document.getElementById('city').value = room.city;
                document.getElementById('pincode').value = room.pincode;
                document.getElementById('size').value = room.size;
                document.getElementById('rent').value = room.rent;
                document.getElementById('Fixtures').value = room.fixtures;
                document.getElementById('facility').value = room.facility;
                document.getElementById('wifi').value = room.wifi;

                landlordSection.classList.remove('hidden');
                renterSection.classList.add('hidden');
            });
        });

        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.getAttribute('data-index');
                if(confirm('Are you sure you want to delete this room?')){
                    rooms.splice(index, 1);
                    saveRooms(rooms);
                    displayRooms();
                }
            });
        });

        document.querySelectorAll('.toggleBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.getAttribute('data-index');
                rooms[index].active = !rooms[index].active;
                saveRooms(rooms);
                displayRooms();
            });
        });
    }

    function attachImageClickEvents(){
        document.querySelectorAll('.clickable-image').forEach(img => {
            img.addEventListener('click', () => {
                console.log('Image clicked');
                popupImage.src = img.src;
                imagePopupOverlay.classList.remove('hidden');
            });
        });
    }

    closePopupBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        popupImage.src = "";
        imagePopupOverlay.classList.add('hidden');
    });

    imagePopupOverlay.addEventListener('click', (e) => {
        if(e.target === imagePopupOverlay){
            console.log('Overlay clicked');
            popupImage.src = "";
            imagePopupOverlay.classList.add('hidden');
        }
    });

    // Search functionality
    if(searchBtn){
        searchBtn.addEventListener('click', () => {
            const query = searchCity.value.trim().toLowerCase();
            if(query.length < 2){
                alert("Please enter at least 2 characters to search.");
                return;
            }
            const filtered = getRooms().filter(room => room.city.toLowerCase().startsWith(query));
            displayRooms(filtered);
        });
    }

    if(clearSearchBtn){
        clearSearchBtn.addEventListener('click', () => {
            searchCity.value = '';
            displayRooms();
        });
    }

    // Initial display
    displayRooms();
});
