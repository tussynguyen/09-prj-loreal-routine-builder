/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const selectedProductsList = document.getElementById("selectedProductsList");
const userInput = document.getElementById("userInput");

/* Get all face area buttons and concern buttons */
const faceAreaButtons = document.querySelectorAll(".face-area");
const concernButtons = document.querySelectorAll(".concern-btn");

/* Get search elements */
const productSearch = document.getElementById("productSearch");
const clearSearchBtn = document.getElementById("clearSearchBtn");

/* Application state - Variables to store our app's data */
let selectedProducts = [];
let allProducts = [];
let selectedFaceArea = null;
let selectedConcern = null;
let currentSearchTerm = ""; // Store current search term

/* Initialize the application when the page loads */
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
  loadSelectedProductsFromStorage(); // Load saved selections
  setupEventListeners();
  showPlaceholderMessage();
  updateSelectedProducts(); // Initialize the selected products display
});

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  // Only save the product IDs to keep it simple
  const selectedIds = selectedProducts.map((p) => p.id);
  localStorage.setItem("selectedProducts", JSON.stringify(selectedIds));
}

/* Load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved && Array.isArray(allProducts) && allProducts.length > 0) {
    const ids = JSON.parse(saved);
    selectedProducts = allProducts.filter((p) => ids.includes(p.id));
  }
}

/* Load L'Oréal products from JSON file */
async function loadProducts() {
  try {
    // Fetch product data from JSON file using async/await
    const response = await fetch("products.json");
    const data = await response.json();

    // Store all products from the JSON file
    allProducts = data.products;

    // Restore selected products from localStorage
    loadSelectedProductsFromStorage();

    // Show all products initially
    displayProducts(allProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    // Show error message if products can't be loaded
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        <i class="fa-solid fa-exclamation-triangle"></i>
        Error loading products. Please try again later.
      </div>
    `;
  }
}

/* Setup event listeners for user interactions */
function setupEventListeners() {
  /* Chat form submission */
  chatForm.addEventListener("submit", handleChatSubmit);

  /* Category filter change */
  categoryFilter.addEventListener("change", filterProducts);

  /* Product search functionality */
  if (productSearch) {
    productSearch.addEventListener("input", handleProductSearch);
  }

  /* Clear search button */
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", clearProductSearch);
  }

  /* Generate routine button */
  generateRoutineBtn.addEventListener("click", generateRoutine);

  /* Face area button clicks */
  faceAreaButtons.forEach((button) => {
    button.addEventListener("click", handleFaceAreaClick);
  });

  /* Concern button clicks */
  concernButtons.forEach((button) => {
    button.addEventListener("click", handleConcernClick);
  });
}

/* Handle product search as user types */
function handleProductSearch(event) {
  /* Get the search term and convert to lowercase for easier matching */
  currentSearchTerm = event.target.value.toLowerCase();

  /* Show or hide clear button based on search input */
  if (currentSearchTerm.length > 0) {
    clearSearchBtn.style.display = "inline-block";
  } else {
    clearSearchBtn.style.display = "none";
  }

  /* Filter and display products based on search and category */
  filterProducts();
}

/* Clear the product search */
function clearProductSearch() {
  /* Clear the search input */
  productSearch.value = "";
  currentSearchTerm = "";

  /* Hide the clear button */
  clearSearchBtn.style.display = "none";

  /* Reset the product display */
  filterProducts();
}

/* Display products in the grid with selection functionality */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML =
      '<p class="no-products">No products found for this category.</p>';
    return;
  }

  /* Create HTML for each product card with search term highlighting */
  productsContainer.innerHTML = products
    .map((product) => {
      /* Check if this product is already selected */
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      const selectedClass = isSelected ? "selected" : "";
      const buttonText = isSelected ? "Remove from Routine" : "Add to Routine";
      const buttonIcon = isSelected ? "fa-minus" : "fa-plus";

      /* Highlight search term in product name if searching */
      let displayName = product.name || "Product Name Not Available";
      if (currentSearchTerm !== "") {
        /* Create a highlighted version of the name */
        const regex = new RegExp(`(${currentSearchTerm})`, "gi");
        displayName = displayName.replace(regex, "<mark>$1</mark>");
      }

      /* Handle missing product properties with fallbacks */
      const productBrand = product.brand || "Brand Not Available";
      const productPrice = product.price || "Price Not Available";
      const productImage =
        product.image || "https://via.placeholder.com/120x120?text=No+Image";
      const productDescription =
        product.description || "No description available";

      return `
        <div class="product-card ${selectedClass}" data-product-id="${product.id}">
          <img src="${productImage}" alt="${displayName}" />
          <div class="product-info">
            <h3>${displayName}</h3>
            <div class="product-brand">${productBrand} • ${productPrice}</div>
            <button class="show-details-btn" onclick="toggleProductDescription(${product.id})">
              <i class="fa-solid fa-info-circle"></i> Details
            </button>
            <button class="select-product-btn ${selectedClass}" onclick="toggleProductSelection(${product.id})">
              <i class="fa-solid ${buttonIcon}"></i> ${buttonText}
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

/* Toggle product selection when user clicks on product card or button */
function toggleProductSelection(productId) {
  // Find the product in our data
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  // Check if product is already selected
  const isCurrentlySelected = selectedProducts.some((p) => p.id === productId);

  if (isCurrentlySelected) {
    // Remove from selected products
    selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  } else {
    // Add to selected products
    selectedProducts.push(product);
  }

  // Save to localStorage
  saveSelectedProductsToStorage();

  // Update both displays
  updateSelectedProducts();
  displayProducts(getFilteredProducts()); // Refresh the product grid
}

/* Toggle product description visibility - now opens modal */
function toggleProductDescription(productId) {
  /* Find the product data */
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  /* Show the product details modal */
  showProductModal(product);
}

/* Create and show product details modal */
function showProductModal(product) {
  /* Create modal if it doesn't exist */
  ensureProductModalExists();

  /* Get modal elements */
  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("productModalContent");

  /* Handle missing product properties with fallbacks */
  const productName = product.name || "Product Name Not Available";
  const productBrand = product.brand || "Brand Not Available";
  const productPrice = product.price || "Price Not Available";
  const productImage =
    product.image || "https://via.placeholder.com/120x120?text=No+Image";
  const productDescription =
    product.description || "No description available for this product.";
  const productCategory = product.category || "Category Not Available";

  /* Fill modal with product information */
  modalContent.innerHTML = `
    <div class="product-modal-header">
      <img src="${productImage}" alt="${productName}" class="modal-product-image" />
      <div class="modal-product-info">
        <h2 class="modal-product-title">${productName}</h2>
        <div class="modal-product-brand">${productBrand}</div>
        <div class="modal-product-price">${productPrice}</div>
      </div>
    </div>
    
    <div class="product-modal-body">
      <h3>Product Details</h3>
      <p class="modal-product-description">${productDescription}</p>
      
      <div class="modal-product-category">
        <strong>Category:</strong> ${productCategory}
      </div>
    </div>
    
    <div class="product-modal-actions">
      <button class="modal-select-btn" onclick="toggleProductSelection(${product.id}); closeProductModal();">
        <i class="fa-solid fa-plus"></i> Add to Routine
      </button>
      <button class="modal-close-btn" onclick="closeProductModal()">
        Close
      </button>
    </div>
  `;

  /* Update the add to routine button if product is already selected */
  const isSelected = selectedProducts.some((p) => p.id === product.id);
  const selectBtn = modalContent.querySelector(".modal-select-btn");
  if (isSelected) {
    selectBtn.innerHTML =
      '<i class="fa-solid fa-minus"></i> Remove from Routine';
    selectBtn.classList.add("selected");
  }

  /* Show the modal */
  modal.style.display = "block";

  /* Add event listener to close modal when clicking outside */
  modal.onclick = function (event) {
    if (event.target === modal) {
      closeProductModal();
    }
  };
}

/* Create product modal if it doesn't exist */
function ensureProductModalExists() {
  if (!document.getElementById("productModal")) {
    const modalDiv = document.createElement("div");
    modalDiv.id = "productModal";
    modalDiv.className = "product-modal";
    modalDiv.innerHTML = `
      <div class="product-modal-content">
        <span class="close-product-modal" onclick="closeProductModal()">&times;</span>
        <div id="productModalContent">
          <!-- Product details will be inserted here -->
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  }
}

/* Close product details modal */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.style.display = "none";
  }
}

/* Handle escape key to close modal */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeProductModal();
    closeRoutineModal(); // Close routine modal too if open
  }
});

/* Update selected products display */
function updateSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      '<div class="no-products">No products selected</div>';
    // Remove clear all button if present
    const clearBtn = document.getElementById("clearAllBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }

  // Create HTML for each selected product tag
  selectedProductsList.innerHTML = selectedProducts
    .map((product) => {
      /* Handle missing product properties with fallbacks */
      const productName = product.name || "Product Name Not Available";
      const productPrice = product.price || "Price Not Available";

      return `
        <div class="selected-product-tag">
          <span>${productName} (${productPrice})</span>
          <button class="remove-btn" onclick="removeProductFromSelection(${product.id})" title="Remove ${productName}">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `;
    })
    .join("");

  // Add "Clear All" button if not present
  if (!document.getElementById("clearAllBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearAllBtn";
    clearBtn.className = "generate-btn";
    clearBtn.style.marginTop = "16px";
    clearBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Clear All';
    clearBtn.onclick = clearAllSelectedProducts;
    selectedProductsList.parentElement.appendChild(clearBtn);
  }
}

/* Clear all selected products and update storage */
function clearAllSelectedProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProducts();
  displayProducts(getFilteredProducts());
}

/* Remove product from selection (called from selected products list) */
function removeProductFromSelection(productId) {
  /* Remove from selected products array */
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Save to localStorage */
  saveSelectedProductsToStorage();

  /* Update both displays */
  updateSelectedProducts();
  displayProducts(getFilteredProducts()); /* Refresh the product grid */
}

/* Get currently filtered products based on category selection */
function getFilteredProducts() {
  let filteredProducts = allProducts;

  /* Apply category filter */
  const selectedCategory = categoryFilter.value;
  if (selectedCategory !== "") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  /* Apply search filter if search functionality exists */
  if (currentSearchTerm !== "") {
    filteredProducts = filteredProducts.filter((product) => {
      /* Handle undefined properties safely */
      const searchInName = (product.name || "")
        .toLowerCase()
        .includes(currentSearchTerm);
      const searchInBrand = (product.brand || "")
        .toLowerCase()
        .includes(currentSearchTerm);
      const searchInDescription = (product.description || "")
        .toLowerCase()
        .includes(currentSearchTerm);
      return searchInName || searchInBrand || searchInDescription;
    });
  }

  return filteredProducts;
}

/* Filter products by category and search - updated to respect facial area selection */
function filterProducts() {
  let filteredProducts;

  /* If a facial area is selected, only show products for that area */
  if (selectedFaceArea) {
    filteredProducts = getRecommendedProductsForArea(selectedFaceArea);
  } else {
    /* Start with all products */
    filteredProducts = allProducts;

    /* Apply category filter first */
    const selectedCategory = categoryFilter.value;
    if (selectedCategory !== "") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === selectedCategory
      );
    }
  }

  /* Apply search filter if user has typed something */
  if (currentSearchTerm !== "") {
    filteredProducts = filteredProducts.filter((product) => {
      /* Check if search term matches product name, brand, or description */
      const searchInName = product.name
        .toLowerCase()
        .includes(currentSearchTerm);
      const searchInBrand = product.brand
        .toLowerCase()
        .includes(currentSearchTerm);
      const searchInDescription = product.description
        .toLowerCase()
        .includes(currentSearchTerm);

      /* Return true if search term is found in any of these fields */
      return searchInName || searchInBrand || searchInDescription;
    });
  }

  /* Display the filtered results */
  displayProducts(filteredProducts);

  /* Show helpful message if no products match the search */
  if (filteredProducts.length === 0) {
    let message = "No products found.";
    if (selectedFaceArea) {
      message = `No products found for ${selectedFaceArea} area.`;
    } else if (currentSearchTerm !== "") {
      message = `No products found matching "${currentSearchTerm}". Try a different search term or clear the search.`;
    } else if (categoryFilter.value !== "") {
      message = `No products found in this category.`;
    }

    productsContainer.innerHTML = `
      <div class="placeholder-message">
        <i class="fa-solid fa-search"></i>
        ${message}
      </div>
    `;
  }
}

/* Reset facial area selection and show all products */
function resetFacialAreaSelection() {
  /* Remove selected class from all face buttons */
  faceAreaButtons.forEach((btn) => btn.classList.remove("selected"));

  /* Clear the selected face area */
  selectedFaceArea = null;

  /* Show all products again */
  displayProducts(getFilteredProducts());
}

/* Update category filter to reset facial area when changed */
categoryFilter.addEventListener("change", function () {
  /* Reset facial area selection when category changes */
  resetFacialAreaSelection();

  /* Apply normal category filtering */
  filterProducts();
});

/* Handle face area button clicks */
function handleFaceAreaClick(event) {
  const button = event.currentTarget;
  const area = button.dataset.area;

  /* Remove selected class from all face buttons */
  faceAreaButtons.forEach((btn) => btn.classList.remove("selected"));

  /* Add selected class to clicked button */
  button.classList.add("selected");

  /* Store the selected area */
  selectedFaceArea = area;

  /* Get recommended products for this face area */
  const recommendedProducts = getRecommendedProductsForArea(area);

  /* Clear current selections and add recommended products */
  selectedProducts = [];
  recommendedProducts.forEach((product) => {
    selectedProducts.push(product);
  });

  /* Update displays to show only recommended products for this facial area */
  updateSelectedProducts();
  displayProducts(recommendedProducts); // Show only the recommended products

  /* Create a detailed routine message for this face area */
  const routineMessage = createDetailedFaceAreaRoutine(
    area,
    recommendedProducts
  );

  /* Add the routine to chat */
  sendDetailedRoutineToChat(routineMessage, area);
}

/* Handle concern button clicks */
function handleConcernClick(event) {
  const button = event.currentTarget;
  const concern = button.dataset.concern;

  /* Remove selected class from all concern buttons */
  concernButtons.forEach((btn) => btn.classList.remove("selected"));

  /* Add selected class to clicked button */
  button.classList.add("selected");

  /* Store the selected concern */
  selectedConcern = concern;

  /* Create a message about the concern */
  const concernMessage = createConcernMessage(concern);

  /* Add the message to chat and get AI response */
  sendMessageToChat(concernMessage);
}

/* Get recommended products for specific face areas using JSON data */
function getRecommendedProductsForArea(area) {
  const productRecommendations = {
    forehead: [
      // Anti-aging and cleansing products specifically for forehead
      allProducts.find(
        (p) => p.name === "Revitalift 1.5% Hyaluronic Acid Serum"
      ),
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Renewing SA Cleanser"),
      allProducts.find(
        (p) =>
          p.name === "RevitaLift Triple Power Broad Spectrum SPF 30 Sunscreen"
      ),
    ].filter(Boolean), // Remove any undefined products

    eyes: [
      // Gentle products specifically for delicate eye area
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Eye Repair Cream"),
      allProducts.find((p) => p.name === "Minéral 89 Hyaluronic Acid Booster"),
      allProducts.find((p) => p.name === "Hydrating Facial Cleanser"),
    ].filter(Boolean),

    nose: [
      // Oil control and deep cleansing products specifically for nose area
      allProducts.find((p) => p.name === "Renewing SA Cleanser"),
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Foaming Facial Cleanser"),
      allProducts.find((p) => p.name === "Effaclar Duo Dual Acne Treatment"),
    ].filter(Boolean),

    cheeks: [
      // Hydration and protection products specifically for cheeks
      allProducts.find(
        (p) => p.name === "Revitalift 1.5% Hyaluronic Acid Serum"
      ),
      allProducts.find(
        (p) =>
          p.name === "RevitaLift Triple Power Broad Spectrum SPF 30 Sunscreen"
      ),
      allProducts.find((p) => p.name === "Moisturizing Cream"),
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Aqualia Thermal Rich Cream"),
    ].filter(Boolean),

    lips: [
      // Gentle cleansing products specifically for lips
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Hydrating Facial Cleanser"),
      allProducts.find((p) => p.name === "Toleriane Hydrating Gentle Cleanser"),
    ].filter(Boolean),

    chin: [
      // Acne control and deep cleansing products specifically for chin area
      allProducts.find((p) => p.name === "Effaclar Duo Dual Acne Treatment"),
      allProducts.find((p) => p.name === "Renewing SA Cleanser"),
      allProducts.find((p) => p.name === "SkinActive Micellar Cleansing Water"),
      allProducts.find((p) => p.name === "Foaming Facial Cleanser"),
    ].filter(Boolean),
  };

  return productRecommendations[area] || [];
}

/* Create a message for concern selection */
function createConcernMessage(concern) {
  const concernMessages = {
    acne: "I have acne-prone skin. What L'Oréal products would help me build an effective acne-fighting routine?",
    aging:
      "I'm concerned about aging and want anti-aging products. What L'Oréal anti-aging routine would you recommend?",
    dryness:
      "My skin is very dry. What L'Oréal products would help hydrate and moisturize my skin?",
    oily: "I have oily skin that gets shiny throughout the day. What L'Oréal products would help control oil?",
    sensitive:
      "I have sensitive skin that reacts easily. What gentle L'Oréal products would you recommend?",
  };

  return (
    concernMessages[concern] ||
    `I have concerns about ${concern}. What L'Oréal products would you recommend?`
  );
}

/* Create detailed routine for face area using JSON product data */
function createDetailedFaceAreaRoutine(area, products) {
  const areaRoutines = {
    forehead: `Here's your personalized FOREHEAD care routine using ${products.length} recommended L'Oréal products:

**MORNING ROUTINE:**
1. **Cleanse** - Use Micellar Cleansing Water on a cotton pad to gently remove impurities
2. **Hydrate** - Apply Revitalift Hyaluronic Acid Serum to forehead area, focusing on fine lines
3. **Protect** - Don't forget sunscreen!

**EVENING ROUTINE:**
1. **Deep Cleanse** - Remove makeup and dirt with Micellar Cleansing Water
2. **Weekly Treatment** - Use Renewing SA Cleanser 2-3 times per week on forehead to prevent breakouts
3. **Night Care** - Apply serum before bed

**FOREHEAD-SPECIFIC TIPS:**
- Pat products gently, don't rub
- Focus on horizontal lines when applying anti-aging serum
- SA cleanser helps prevent forehead acne`,

    eyes: `Here's your personalized EYE AREA care routine using ${products.length} recommended products:

**MORNING ROUTINE:**
1. **Gentle Cleanse** - Use Micellar Cleansing Water on cotton pad, no rubbing
2. **Hydrate** - Gently pat Eye Repair Cream around eye area
3. **Boost** - Apply Minéral 89 for extra hydration

**EVENING ROUTINE:**
1. **Makeup Removal** - Micellar Water removes eye makeup without tugging
2. **Night Care** - Light layer of Eye Repair Cream around eyes

**EYE AREA-SPECIFIC TIPS:**
- Never rub or pull the delicate eye skin
- Use ring finger for gentlest application
- Apply products from inner to outer corner
- Keep products at least 1/4 inch from lash line`,

    nose: `Here's your personalized NOSE care routine using ${products.length} recommended products:

**MORNING ROUTINE:**
1. **Daily Cleanse** - Use Foaming Facial Cleanser on nose area to remove oil buildup
2. **Oil Control** - Let skin air dry completely

**EVENING ROUTINE:**
1. **Deep Cleanse** - Thorough cleansing with Micellar Water
2. **Weekly Treatment** - Use Renewing SA Cleanser on nose 2-3 times per week

**NOSE-SPECIFIC TIPS:**
- Pay extra attention to sides of nose where oil accumulates
- SA cleanser helps with blackheads and enlarged pores
- Don't over-cleanse as it can increase oil production`,

    cheeks: `Here's your personalized CHEEK care routine using ${products.length} recommended products:

**MORNING ROUTINE:**
1. **Gentle Cleanse** - Use Micellar Water all over cheek area
2. **Hydrate** - Apply Revitalift Hyaluronic Acid Serum in upward motions
3. **Moisturize** - Follow with Moisturizing Cream for extra hydration
4. **Protect** - RevitaLift SPF 30 Sunscreen for UV protection

**EVENING ROUTINE:**
1. **Remove Impurities** - Thorough cleansing with Micellar Water
2. **Night Repair** - Apply serum for overnight renewal

**CHEEK-SPECIFIC TIPS:**
- Always apply products in upward, outward motions
- Cheeks need extra hydration and sun protection
- Layer products from thinnest to thickest consistency`,

    lips: `Here's your personalized LIP care routine using ${products.length} recommended products:

**MORNING & EVENING:**
1. **Gentle Cleanse** - Use Micellar Water to remove lip products
2. **Hydrate** - Follow with Hydrating Facial Cleanser for gentle care
3. **Prep for Products** - Clean lips absorb treatments better

**LIP-SPECIFIC TIPS:**
- Use gentle circular motions when cleansing
- Never pull or tug on lip skin
- Follow with a good lip balm after cleansing
- Micellar water removes even waterproof lip products`,

    chin: `Here's your personalized CHIN care routine using ${products.length} recommended products:

**MORNING ROUTINE:**
1. **Daily Cleanse** - Focus on chin area with Micellar Water
2. **Treatment** - Apply Effaclar Duo for acne prevention

**EVENING ROUTINE:**
1. **Deep Cleanse** - Remove buildup with Micellar Water
2. **Weekly Treatment** - Renewing SA Cleanser 2-3 times per week on chin area
3. **Acne Care** - Apply Effaclar Duo as directed

**CHIN-SPECIFIC TIPS:**
- Chin area is prone to hormonal breakouts
- Effaclar Duo helps prevent and treat blemishes
- Don't forget to cleanse under the jawline`,
  };

  return (
    areaRoutines[area] ||
    `Here's your routine for ${area} area using the recommended products.`
  );
}

/* Send detailed routine to chat with special formatting */
async function sendDetailedRoutineToChat(routineMessage, area) {
  /* Clear previous chat content */
  chatWindow.innerHTML = "";

  /* Add a header message */
  addMessageToChat(
    "user",
    `I want to focus on my ${area} area and get product recommendations.`
  );

  /* Show loading message */
  showLoadingMessage();

  /* Simulate a brief delay for better UX */
  setTimeout(() => {
    removeLoadingMessage();

    /* Add the detailed routine */
    const messageDiv = document.createElement("div");
    messageDiv.className = "message assistant-message";
    messageDiv.innerHTML = `
      <div class="routine-response">
        <h3><i class="fa-solid fa-face-smile"></i> ${area.toUpperCase()} Care Specialist</h3>
        <div class="routine-content">${routineMessage.replace(
          /\n/g,
          "<br>"
        )}</div>
        <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px;">
          <strong>✨ Products Automatically Added:</strong> Check your "Selected Products" section below to see the recommended items for your ${area} routine!
        </div>
      </div>
    `;

    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    onRoutineFinished();
  }, 1000);
}

/* Send a message to the chat and get AI response */
async function sendMessageToChat(message) {
  /* Add user message to chat window */
  addMessageToChat("user", message);

  /* Show loading message while AI thinks */
  showLoadingMessage();

  try {
    /* Get AI response using OpenAI API */
    const response = await getOpenAIResponse(message);

    /* Remove loading message and show AI response */
    removeLoadingMessage();
    addMessageToChat("assistant", response);
  } catch (error) {
    console.error("Error getting AI response:", error);
    removeLoadingMessage();
    showErrorMessage("Sorry, I encountered an error. Please try again.");
  }
}

/* Add message to chat window */
function addMessageToChat(sender, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  if (sender === "user") {
    messageDiv.innerHTML = `
      <div style="text-align: right; margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;">
        <strong>You:</strong> ${message}
      </div>
    `;
  } else {
    /* Format the AI response for better readability */
    const formattedMessage = formatAIResponse(message);

    messageDiv.innerHTML = `
      <div class="ai-response">
        <h3><i class="fa-solid fa-robot"></i> L'Oréal Assistant</h3>
        <div class="ai-content">${formattedMessage}</div>
      </div>
    `;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Format AI response to be more readable with bullet points and sections */
function formatAIResponse(message) {
  /* Replace line breaks with proper HTML breaks */
  let formatted = message.replace(/\n/g, "<br>");

  /* Format URLs as clickable links */
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="ai-link">$1</a>'
  );

  /* Format numbered lists - convert "1. " to proper numbered list items */
  formatted = formatted.replace(
    /(\d+)\.\s+/g,
    '<div class="step-item"><span class="step-number">$1</span>'
  );

  /* Close step items before the next step or at the end */
  formatted = formatted.replace(
    /(<div class="step-item">.*?)(?=<div class="step-item">|$)/g,
    "$1</div>"
  );

  /* Format bullet points - convert "- " or "• " to proper bullet list items */
  formatted = formatted.replace(/[•-]\s+/g, '<div class="bullet-item">• ');

  /* Close bullet items before the next bullet or at the end */
  formatted = formatted.replace(
    /(<div class="bullet-item">.*?)(?=<div class="bullet-item">|<div class="step-item">|$)/g,
    "$1</div>"
  );

  /* Format bold text with ** markers */
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  /* Format section headers (text followed by colon) */
  formatted = formatted.replace(
    /^([A-Z][^:]*:)$/gm,
    '<h4 class="section-header">$1</h4>'
  );

  /* Add spacing between sections */
  formatted = formatted.replace(
    /<h4 class="section-header">/g,
    '<div class="section-break"></div><h4 class="section-header">'
  );

  /* Format citations or sources */
  formatted = formatted.replace(
    /Source:|Sources:|Citation:|Citations:/gi,
    '<div class="citation-header"><strong>$&</strong></div>'
  );

  return formatted;
}

/* Enhanced OpenAI response function with web search capabilities */
async function getOpenAIResponse(userMessage) {
  /* Create context about selected products and preferences */
  let context =
    "You are a helpful L'Oréal beauty advisor with access to current web information.";

  if (selectedProducts.length > 0) {
    context += ` Selected products: ${selectedProducts
      .map((p) => p.name)
      .join(", ")}.`;
  }

  if (selectedFaceArea) {
    context += ` User is focusing on: ${selectedFaceArea}.`;
  }

  if (selectedConcern) {
    context += ` User's main concern: ${selectedConcern}.`;
  }

  /* Enhanced prompt to encourage web search */
  const enhancedPrompt = `${userMessage}

Please provide helpful advice about L'Oréal products, beauty trends, or skincare routines related to this question. Include step-by-step instructions when appropriate and make your response easy to read and follow.`;

  /* Create messages array for the OpenAI API */
  const messages = [
    {
      role: "system",
      content:
        context +
        " Provide helpful advice about L'Oréal products and skincare routines. Make your responses clear, step-by-step, and easy to understand for beginners.",
    },
    {
      role: "user",
      content: enhancedPrompt,
    },
  ];

  /* Make API request using fetch */
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Using gpt-4o model
      messages: messages,
      max_tokens: 800, // Increased for more detailed responses
      temperature: 0.7,
    }),
  });

  /* Check if request was successful */
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  /* Parse response and return the AI's message */
  const data = await response.json();
  return data.choices[0].message.content;
}

/* Show loading message while AI is thinking */
function showLoadingMessage() {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading-message";
  loadingDiv.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Thinking about your request...
  `;
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Remove loading message */
function removeLoadingMessage() {
  const loadingMessage = chatWindow.querySelector(".loading-message");
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

/* Show error message */
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `
    <i class="fa-solid fa-exclamation-triangle"></i>
    ${message}
  `;
  chatWindow.appendChild(errorDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Show placeholder message in chat window */
function showPlaceholderMessage() {
  chatWindow.innerHTML = `
    <div class="placeholder-message">
      <i class="fa-solid fa-comments"></i>
      Select a face area above, choose a concern, or ask me about L'Oréal products and routines!
    </div>
  `;
}

/* Handle chat form submission (when user types a message) */
async function handleChatSubmit(event) {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  /* Clear the input field */
  userInput.value = "";

  /* Send the message to chat */
  await sendMessageToChat(message);
}

/* Generate routine using AI with selected products */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    showErrorMessage(
      "Please select some products first to generate a routine."
    );
    return;
  }

  // Create detailed product list for AI
  const productDetails = selectedProducts
    .map((p) => `${p.name} (${p.description})`)
    .join(", ");
  let routinePrompt = `Create a detailed skincare routine using these L'Oréal products: ${productDetails}.`;

  // Add face area context if selected
  if (selectedFaceArea) {
    routinePrompt += ` Focus especially on the ${selectedFaceArea} area.`;
  }

  // Add concern context if selected
  if (selectedConcern) {
    routinePrompt += ` Address ${selectedConcern} concerns.`;
  }

  routinePrompt +=
    " Include step-by-step instructions, order of application, and timing for morning and evening routines.";

  await sendMessageToChat(routinePrompt);
  onRoutineFinished();
}

/* Modal logic for showing chat history or finish routine */
function ensureModalExists() {
  if (!document.getElementById("routineModal")) {
    const modalDiv = document.createElement("div");
    modalDiv.id = "routineModal";
    modalDiv.className = "modal";
    modalDiv.innerHTML = `
      <div class="modal-content">
        <span class="close-modal" id="closeModalBtn">&times;</span>
        <h2>Routine & Chat History</h2>
        <div id="modalChatHistory"></div>
        <button id="closeRoutineModal" class="generate-btn" style="margin-top:20px;">Close</button>
      </div>
    `;
    document.body.appendChild(modalDiv);

    // Modal close logic
    document.getElementById("closeModalBtn").onclick = closeRoutineModal;
    document.getElementById("closeRoutineModal").onclick = closeRoutineModal;
    window.onclick = function (event) {
      if (event.target === modalDiv) closeRoutineModal();
    };
  }
}

function showRoutineModal() {
  ensureModalExists();
  const modal = document.getElementById("routineModal");
  const modalChatHistory = document.getElementById("modalChatHistory");
  modalChatHistory.innerHTML = chatWindow.innerHTML;
  modal.style.display = "block";
}

function closeRoutineModal() {
  const modal = document.getElementById("routineModal");
  if (modal) modal.style.display = "none";
}

function addFinishRoutineButton() {
  if (!document.getElementById("finishRoutineBtn")) {
    const btn = document.createElement("button");
    btn.id = "finishRoutineBtn";
    btn.className = "generate-btn";
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Finish the routine';
    btn.style.marginTop = "20px";
    btn.onclick = showRoutineModal;
    chatWindow.parentElement.appendChild(btn);
  }
}

function onRoutineFinished() {
  addFinishRoutineButton();
}
