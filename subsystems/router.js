// This function creates a navigation bar and adds it to the top of the body
function createNav() {
    const nav = document.createElement('nav');
    
    // Define the links and their file names
    nav.innerHTML = `
        <div class="nav-links">
            <a href="../index.html">Home</a>
            <a href="../skeleton/problem_placeholder.html">Vents | Problems</a>
            <a href="../skeleton/auth_placeholder.html">Login | Sign-up</a>
            <a href="../skeleton/profile_placeholder.html">Profile</a>
        </div>
    `;

    // Add styles to the navigation bar directly via JS
    nav.style.background = "#333";
    nav.style.padding = "10px";
    nav.style.display = "flex";
    nav.style.justifyContent = "center";
    
    // Apply styles to all links inside the nav
    document.body.prepend(nav);

    const style = document.createElement('style');
    style.innerHTML = `
        .nav-links a {
            color: white;
            text-decoration: none;
            margin: 0 15px;
            font-family: sans-serif;
            font-weight: bold;
        }
        .nav-links a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);
}

// Execute the function when the script loads
createNav();