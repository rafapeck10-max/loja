// MOBILI - E-COMMERCE LOGIC

document.addEventListener('DOMContentLoaded', () => {
    // State
    let cart = JSON.parse(localStorage.getItem('mobili_cart')) || [];

    // Elements
    const mainHeader = document.getElementById('main-header');
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const productGrid = document.getElementById('product-grid');
    const toastContainer = document.getElementById('toast-container');

    // WhatsApp Configuration
    const whatsappNumber = '5521986559996'; // Shop WhatsApp

    /* --- HEADER SCROLL EFFECT --- */
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader?.classList.add('scrolled');
        } else {
            mainHeader?.classList.remove('scrolled');
        }
    });

    /* --- CART DRAWER ACTIONS --- */
    function openCart() {
        cartDrawer?.classList.add('active');
        cartOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeCart() {
        cartDrawer?.classList.remove('active');
        cartOverlay?.classList.remove('active');
        document.body.style.overflow = ''; // Unlock background scroll
    }

    cartBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });
    closeCartBtn?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);

    /* --- TOAST NOTIFICATIONS --- */
    function showToast(message) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Remove toast from DOM after animation completes (3s total)
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /* --- CART FUNCTIONALITY --- */
    function saveCart() {
        localStorage.setItem('mobili_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function addToCart(product) {
        const existingItem = cart.find(item => 
            item.id === product.id && 
            item.color === product.color && 
            item.finish === product.finish
        );

        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            cart.push(product);
        }

        saveCart();
        showToast(`${product.name} adicionado ao carrinho!`);
        openCart();
    }

    function updateQuantity(id, color, finish, delta) {
        const item = cart.find(item => item.id === id && item.color === color && item.finish === finish);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => !(i.id === id && i.color === color && i.finish === finish));
            }
            saveCart();
        }
    }

    function removeItem(id, color, finish) {
        const item = cart.find(i => i.id === id && i.color === color && i.finish === finish);
        cart = cart.filter(i => !(i.id === id && i.color === color && i.finish === finish));
        saveCart();
        if (item) {
            showToast(`${item.name} removido do carrinho.`);
        }
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function updateCartUI() {
        // Update Count Badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Clear container
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-couch"></i>
                    <p>Seu carrinho está vazio.</p>
                </div>
            `;
            if (cartTotalPriceEl) cartTotalPriceEl.textContent = formatCurrency(0);
            if (checkoutBtn) {
                checkoutBtn.style.pointerEvents = 'none';
                checkoutBtn.style.opacity = '0.5';
            }
            return;
        }

        if (checkoutBtn) {
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.style.opacity = '1';
        }

        let totalPrice = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            const cartItemHtml = document.createElement('div');
            cartItemHtml.className = 'cart-item';
            
            // Build options labels if present
            let optionsText = '';
            if (item.color || item.finish) {
                const opts = [];
                if (item.color) opts.push(`Cor: ${item.color}`);
                if (item.finish) opts.push(`Pés: ${item.finish}`);
                optionsText = `<span style="font-size: 11px; color: var(--text-light); display:block; margin-top:3px;">${opts.join(' | ')}</span>`;
            }

            cartItemHtml.innerHTML = `
                <img src="${item.img}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-details">
                    <div>
                        <h4 class="cart-item-name">${item.name}</h4>
                        ${optionsText}
                    </div>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                    <div class="cart-item-ctrl">
                        <div class="qty-control">
                            <button class="qty-btn minus-btn" data-id="${item.id}" data-color="${item.color || ''}" data-finish="${item.finish || ''}"><i class="fa-solid fa-minus"></i></button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn plus-btn" data-id="${item.id}" data-color="${item.color || ''}" data-finish="${item.finish || ''}"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <button class="remove-item" data-id="${item.id}" data-color="${item.color || ''}" data-finish="${item.finish || ''}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemHtml);
        });

        if (cartTotalPriceEl) {
            cartTotalPriceEl.textContent = formatCurrency(totalPrice);
        }

        // Add listeners to new items
        cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicked = e.currentTarget;
                updateQuantity(
                    btnClicked.dataset.id, 
                    btnClicked.dataset.color || null, 
                    btnClicked.dataset.finish || null, 
                    -1
                );
            });
        });

        cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicked = e.currentTarget;
                updateQuantity(
                    btnClicked.dataset.id, 
                    btnClicked.dataset.color || null, 
                    btnClicked.dataset.finish || null, 
                    1
                );
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicked = e.currentTarget;
                removeItem(
                    btnClicked.dataset.id, 
                    btnClicked.dataset.color || null, 
                    btnClicked.dataset.finish || null
                );
            });
        });

        // Update WhatsApp message link
        updateWhatsAppLink(totalPrice);
    }

    function updateWhatsAppLink(totalPrice) {
        if (!checkoutBtn) return;

        let message = `Olá Mobili! Gostaria de fazer um pedido:\n\n`;
        
        cart.forEach((item, index) => {
            message += `*${index + 1}. ${item.name}*\n`;
            if (item.color || item.finish) {
                const opts = [];
                if (item.color) opts.push(`Cor: ${item.color}`);
                if (item.finish) opts.push(`Pés: ${item.finish}`);
                message += `   _(${opts.join(', ')})_\n`;
            }
            message += `   Qtd: ${item.quantity}x | Preço: ${formatCurrency(item.price)}\n\n`;
        });

        message += `*Valor Total:* ${formatCurrency(totalPrice)}\n\n`;
        message += `Gostaria de combinar a entrega e o pagamento na entrega (Nova Iguaçu / Baixada Fluminense).`;

        const encodedMessage = encodeURIComponent(message);
        checkoutBtn.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    }

    /* --- DETECT LANDING PAGE QUICK ADD --- */
    document.querySelectorAll('.btn-quick-add').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = button.closest('.card');
            if (!card) return;

            const product = {
                id: button.dataset.id,
                name: button.dataset.name,
                price: parseFloat(button.dataset.price),
                img: button.dataset.img,
                quantity: 1,
                color: null,
                finish: null
            };

            addToCart(product);
        });
    });

    /* --- DETECT PRODUCT PAGE ADD TO CART --- */
    const addToCartProductPageBtn = document.getElementById('add-to-cart-product');
    const buyNowProductPageBtn = document.getElementById('buy-now-product');

    function getSelectedProductDetails() {
        if (!addToCartProductPageBtn) return null;

        const id = addToCartProductPageBtn.dataset.id;
        const name = addToCartProductPageBtn.dataset.name;
        const price = parseFloat(addToCartProductPageBtn.dataset.price);
        const img = addToCartProductPageBtn.dataset.img;

        // Get options if they exist
        const checkedColor = document.querySelector('input[name="color"]:checked');
        const color = checkedColor ? checkedColor.value : null;

        const checkedFinish = document.querySelector('input[name="finish"]:checked');
        const finish = checkedFinish ? checkedFinish.value : null;

        const qtyValEl = document.getElementById('product-qty-val');
        const quantity = qtyValEl ? parseInt(qtyValEl.textContent) : 1;

        return { id, name, price, img, quantity, color, finish };
    }

    addToCartProductPageBtn?.addEventListener('click', () => {
        const product = getSelectedProductDetails();
        if (product) {
            addToCart(product);
        }
    });

    buyNowProductPageBtn?.addEventListener('click', () => {
        const product = getSelectedProductDetails();
        if (product) {
            // First add to cart
            addToCart(product);
            // Then open cart
            openCart();
        }
    });

    // Product Detail Page Qty Controls (+/-)
    const detailQtyMinus = document.getElementById('detail-qty-minus');
    const detailQtyPlus = document.getElementById('detail-qty-plus');
    const detailQtyVal = document.getElementById('product-qty-val');

    detailQtyMinus?.addEventListener('click', () => {
        if (detailQtyVal) {
            let current = parseInt(detailQtyVal.textContent);
            if (current > 1) {
                detailQtyVal.textContent = current - 1;
            }
        }
    });

    detailQtyPlus?.addEventListener('click', () => {
        if (detailQtyVal) {
            let current = parseInt(detailQtyVal.textContent);
            detailQtyVal.textContent = current + 1;
        }
    });

    /* --- LIVE SEARCH FILTER --- */
    function filterProducts() {
        if (!productGrid) return;
        
        const query = searchInput.value.toLowerCase().trim();
        const cards = productGrid.querySelectorAll('.card');
        let visibleCount = 0;

        cards.forEach(card => {
            const name = card.querySelector('.card-name').textContent.toLowerCase();
            if (name.includes(query)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Manage "No products found" state
        let noResultsEl = productGrid.querySelector('.no-results');
        
        if (visibleCount === 0) {
            if (!noResultsEl) {
                noResultsEl = document.createElement('div');
                noResultsEl.className = 'no-results';
                noResultsEl.innerHTML = `
                    <i class="fa-solid fa-couch"></i>
                    <p>Nenhum móvel encontrado para a busca "${searchInput.value}".</p>
                `;
                productGrid.appendChild(noResultsEl);
            } else {
                noResultsEl.querySelector('p').textContent = `Nenhum móvel encontrado para a busca "${searchInput.value}".`;
                noResultsEl.style.display = '';
            }
        } else {
            if (noResultsEl) {
                noResultsEl.style.display = 'none';
            }
        }
    }

    searchInput?.addEventListener('input', filterProducts);
    searchBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        filterProducts();
    });

    /* --- GALLERY ACCORDIONS --- */
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (content) {
                if (header.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    content.style.maxHeight = '0px';
                }
            }
        });
    });

    /* --- GALLERY THUMBNAIL SWITCHER --- */
    const thumbItems = document.querySelectorAll('.thumb-item');
    const mainProductImg = document.getElementById('main-product-img');

    thumbItems.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbItems.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            const newSrc = thumb.querySelector('img').src;
            if (mainProductImg) {
                mainProductImg.src = newSrc;
            }
        });
    });
// --- CAROUSEL NAVIGATION & SYNC ---
        const carouselWrapper = document.getElementById('carousel-wrapper');
        const carouselPrev = document.getElementById('carousel-prev');
        const carouselNext = document.getElementById('carousel-next');
        const carouselDots = document.querySelectorAll('.carousel-dots .dot');
        const slides = document.querySelectorAll('.carousel-slide');
        let activeSlide = 0;

        function updateCarousel() {
            // Move slides
            const offset = -activeSlide * 100; // percentage
            carouselWrapper.style.transform = `translateX(${offset}%)`;
            // Update dots
            carouselDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activeSlide);
            });
            // Sync thumbnail active state
            thumbItems.forEach((t, i) => t.classList.toggle('active', i === activeSlide));
        }

        carouselPrev?.addEventListener('click', () => {
            activeSlide = (activeSlide - 1 + slides.length) % slides.length;
            updateCarousel();
        });
        carouselNext?.addEventListener('click', () => {
            activeSlide = (activeSlide + 1) % slides.length;
            updateCarousel();
        });

        // Dot navigation
        carouselDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                activeSlide = i;
                updateCarousel();
            });
        });

        // Thumbnail click already updates main image; also sync carousel when thumbnail clicked
        thumbItems.forEach((thumb, i) => {
            thumb.addEventListener('click', () => {
                activeSlide = i;
                updateCarousel();
            });
        });

        // Initialize first state
        updateCarousel();
    // Initialize UI on load
    updateCartUI();
});
