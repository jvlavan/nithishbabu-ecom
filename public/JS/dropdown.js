document.addEventListener("click", function(event) {
    const dropdownMenu = document.getElementById("dropdown-menu");
    const profileButton = document.querySelector(".profile");
    const isClickInsideMenu = dropdownMenu.contains(event.target);
    const isClickOnButton = event.target === profileButton || event.target.parentNode === profileButton;

    if (!isClickInsideMenu && !isClickOnButton) {
        dropdownMenu.classList.remove("active");
    }
});

// Function to toggle the visibility of the dropdown menu
function dropmenutoggle() {
    const dropdownMenu = document.getElementById("dropdown-menu");
    dropdownMenu.classList.toggle("active");
}