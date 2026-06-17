document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       0. PRELOADER & CUSTOM CURSOR INTERACTS & SCROLL REVEALS
       ========================================================================== */
    // Preloader Shutter Capture & Audio Click Engine
    const preloader = document.getElementById('preloader');
    const preloaderPct = document.getElementById('preloader-pct');
    const preloaderLine = document.querySelector('.preloader-line');
    const preloaderLineWrap = document.getElementById('preloader-line-wrap');
    const preloaderCounterWrap = document.getElementById('preloader-counter-wrap');
    const shutterBtn = document.getElementById('shutterBtn');
    const shutterFlash = document.getElementById('shutterFlash');

    // Synthesis of camera shutter sound using Web Audio API
    function playShutterSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // 1. Shutter noise sweep (mechanical "shhhk" sound)
            const bufferSize = ctx.sampleRate * 0.15; // 0.15s duration
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1000;
            noiseFilter.Q.value = 3;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

            noiseNode.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            // 2. High-pitched metallic shutter "tick" (oscillator click sweep)
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2000, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);

            oscGain.gain.setValueAtTime(0.6, ctx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

            osc.connect(oscGain);
            oscGain.connect(ctx.destination);

            noiseNode.start();
            osc.start();

            noiseNode.stop(ctx.currentTime + 0.15);
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            console.warn("AudioContext block:", e);
        }
    }

    let currentPct = 0;
    const interval = setInterval(() => {
        currentPct += Math.floor(Math.random() * 15) + 5;
        if (currentPct >= 100) {
            currentPct = 100;
            clearInterval(interval);

            // Reached 100%, trigger auto camera click
            setTimeout(() => {
                // Play Web Audio camera shutter tick sound
                // playShutterSound();

                // Fire camera flash animation
                if (shutterFlash) {
                    shutterFlash.classList.add('flash-trigger');
                }

                // Fade out progress elements instantly during flash
                if (preloaderLineWrap) preloaderLineWrap.style.opacity = '0';
                if (preloaderCounterWrap) preloaderCounterWrap.style.opacity = '0';

                // Slide preloader out after flash peak duration (200ms)
                setTimeout(() => {
                    if (preloader) {
                        preloader.classList.add('fade-out');
                        setTimeout(() => {
                            preloader.style.display = 'none';
                        }, 1700);
                    }
                }, 200);
            }, 500); // 500ms pause after 100% before auto-click triggers
        }
        if (preloaderPct) preloaderPct.textContent = currentPct.toString().padStart(2, '0');
        if (preloaderLine) preloaderLine.style.width = `${currentPct}%`;
    }, 60);



    // Hero slideshow rotation disabled - static background active

    // Scroll Reveal Intersection Observer
    const elementsToReveal = document.querySelectorAll('section, .section-title, .about-image-wrapper, .gear-card, .pricing-card, .testimonial-card, .booking-form-wrapper');
    elementsToReveal.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    });
    elementsToReveal.forEach(el => revealObserver.observe(el));

    /* ==========================================================================
       1. SCROLL PROGRESS INDICATOR & HEADER SCROLL EFFECT
       ========================================================================== */
    const scrollProgress = document.getElementById('scroll-progress');
    const header = document.querySelector('.glass-header');

    window.addEventListener('scroll', () => {
        // Calculate scroll percentage
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;

        if (scrollProgress) {
            scrollProgress.style.width = scrolled + '%';
        }

        // Toggle header scrolled state
        if (winScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ==========================================================================
       2. MOBILE MENU BURGER TOGGLE
       ========================================================================== */
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isActive = menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ==========================================================================
       3. INTERSECTION OBSERVER FOR ACTIVE NAVIGATION LINKS
       ========================================================================== */
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section occupies sweet spot of screen
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    /* ==========================================================================
       4. PORTFOLIO DYNAMIC LOADING & FILTERABLE GRID
       ========================================================================== */
    const portfolioGrid = document.getElementById('portfolioGrid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const footerFilterLinks = document.querySelectorAll('[data-footer-filter]');

    // Get responsive batch size (4 for mobile, 6 for desktop)
    function getBatchSize() {
        return window.innerWidth <= 900 ? 4 : 6;
    }

    let visibleLimit = getBatchSize();
    const seeMoreBtn = document.getElementById('seeMoreBtn');
    const seeMoreContainer = document.getElementById('seeMoreContainer');

    let portfolioItems = []; // Will be populated dynamically after render
    let activeItems = [];    // Contains current visible portfolio items
    let currentIdx = 0;      // Index of current image in activeItems

    // Capitalize category names for display
    function formatCategoryName(category) {
        if (!category) return '';
        if (category.toLowerCase() === 'street') return 'Street Art';
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    async function loadPortfolio() {
        try {
            // First check if global window.portfolioData is available (CORS-safe / instant)
            if (window.portfolioData && Array.isArray(window.portfolioData)) {
                renderPortfolio(window.portfolioData);
                return;
            }
            // Fallback to fetch
            const response = await fetch('assets/portfolio-data.js');
            if (!response.ok) {
                throw new Error('Failed to load portfolio database');
            }
            const text = await response.text();
            const jsonStart = text.indexOf('[');
            const jsonEnd = text.lastIndexOf(']') + 1;
            const data = JSON.parse(text.slice(jsonStart, jsonEnd));
            renderPortfolio(data);
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
    }

    function renderPortfolio(items) {
        if (!portfolioGrid) return;
        
        portfolioGrid.innerHTML = ''; // Clear existing items

        items.forEach(item => {
            const itemHTML = `
                <div class="portfolio-item" data-category="${item.category}">
                    <div class="portfolio-card">
                        <img src="${item.src}" alt="${item.title}" class="portfolio-img">
                        <div class="portfolio-overlay">
                            <span class="portfolio-cat uppercase-tracking">${formatCategoryName(item.category)}</span>
                            <h3 class="portfolio-item-title">${item.title}</h3>
                            <div class="portfolio-exif">
                                <span><i class="fa-solid fa-camera"></i> ${item.camera}</span>
                                <span><i class="fa-solid fa-circle-dot"></i> ${item.lens}</span>
                                <span><i class="fa-solid fa-bolt"></i> ${item.aperture}</span>
                            </div>
                            <button class="btn-lightbox-trigger" aria-label="Open Lightbox">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            portfolioGrid.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Re-query newly created portfolio item elements
        portfolioItems = document.querySelectorAll('.portfolio-item');

        // Re-setup lightbox trigger listeners on cards
        setupLightboxCardListeners();

        // Run initial filter display
        filterPortfolio('all');
    }

    function filterPortfolio(filterValue) {
        let shownCount = 0;
        portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filterValue === 'all') {
                if (shownCount < visibleLimit) {
                    item.style.display = 'block';
                    // Trigger reflow
                    item.offsetHeight;
                    setTimeout(() => {
                        item.classList.add('show');
                    }, 50);
                    shownCount++;
                } else {
                    item.classList.remove('show');
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 500);
                }
            } else {
                if (category === filterValue) {
                    if (shownCount < visibleLimit) {
                        item.style.display = 'block';
                        // Trigger reflow
                        item.offsetHeight;
                        setTimeout(() => {
                            item.classList.add('show');
                        }, 50);
                        shownCount++;
                    } else {
                        item.classList.remove('show');
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 500);
                    }
                } else {
                    item.classList.remove('show');
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 500);
                }
            }
        });

        // Update active filter button state
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filterValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle "See More" button container visibility (only if more matching items than visibleLimit)
        const totalMatchingItems = Array.from(portfolioItems).filter(item => {
            if (filterValue === 'all') return true;
            return item.getAttribute('data-category') === filterValue;
        }).length;

        if (seeMoreContainer) {
            if (totalMatchingItems > visibleLimit) {
                seeMoreContainer.style.display = 'block';
                // Trigger reflow
                seeMoreContainer.offsetHeight;
                seeMoreContainer.style.opacity = '1';
            } else {
                seeMoreContainer.style.opacity = '0';
                setTimeout(() => {
                    seeMoreContainer.style.display = 'none';
                }, 400);
            }
        }
    }

    // Direct clicks on portfolio filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterValue = button.getAttribute('data-filter');
            visibleLimit = getBatchSize(); // Reset page size limit on filter change
            filterPortfolio(filterValue);
        });
    });

    // Links in footer categories to filter portfolio and scroll to it
    footerFilterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filterValue = link.getAttribute('data-footer-filter');
            visibleLimit = getBatchSize(); // Reset page size limit on filter change
            filterPortfolio(filterValue);

            const portfolioSection = document.getElementById('portfolio');
            if (portfolioSection) {
                portfolioSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // See More click event handler
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', () => {
            visibleLimit += getBatchSize(); // Load next batch of 4 or 6 items
            
            // Get active category filter
            const activeFilterBtn = Array.from(filterButtons).find(btn => btn.classList.contains('active'));
            const currentFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
            
            filterPortfolio(currentFilter);
        });
    }

    /* ==========================================================================
       5. INTERACTIVE LIGHTBOX MODAL WITH KEYBOARD NAVIGATION
       ========================================================================== */
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCat = document.getElementById('lightboxCat');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    function setupLightboxCardListeners() {
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach((card) => {
            let touchHandled = false;

            const triggerOpen = (e) => {
                // Gather only items currently visible based on active filter
                activeItems = Array.from(portfolioItems).filter(item => item.style.display !== 'none');

                // Find parent item clicked
                const parentItem = card.closest('.portfolio-item');
                currentIdx = activeItems.indexOf(parentItem);

                openLightbox(activeItems[currentIdx]);
            };

            card.addEventListener('click', (e) => {
                if (touchHandled) {
                    touchHandled = false;
                    return;
                }
                triggerOpen(e);
            });

            card.addEventListener('touchend', (e) => {
                touchHandled = true;
                // Prevent ghost click that mobile browsers fire 300ms later
                e.preventDefault();
                triggerOpen(e);
            }, { passive: false });
        });
    }

    function openLightbox(item) {
        if (!item) return;

        const imgElement = item.querySelector('.portfolio-img');
        const catElement = item.querySelector('.portfolio-cat');
        const titleElement = item.querySelector('.portfolio-item-title');

        lightboxImg.src = imgElement.src;
        lightboxImg.alt = imgElement.alt;
        lightboxCat.textContent = catElement.textContent;
        lightboxTitle.textContent = titleElement.textContent;

        lightboxModal.style.display = 'flex';
        lightboxModal.setAttribute('aria-hidden', 'false');

        // Wait for next layout pass to apply opacity fade in transition
        setTimeout(() => {
            lightboxModal.classList.add('active');
        }, 10);

        document.body.style.overflow = 'hidden'; // Lock main scrollbar
    }

    function closeLightbox() {
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');

        setTimeout(() => {
            lightboxModal.style.display = 'none';
        }, 400); // Match CSS transition duration

        document.body.style.overflow = ''; // Unlock scrollbar
    }

    function showNextImage() {
        if (activeItems.length === 0) return;
        currentIdx = (currentIdx + 1) % activeItems.length;
        openLightbox(activeItems[currentIdx]);
    }

    function showPrevImage() {
        if (activeItems.length === 0) return;
        currentIdx = (currentIdx - 1 + activeItems.length) % activeItems.length;
        openLightbox(activeItems[currentIdx]);
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', showPrevImage);
        lightboxNext.addEventListener('click', showNextImage);

        // Click outside image wrapper to close
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-content-wrapper')) {
                closeLightbox();
            }
        });

        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            if (!lightboxModal.classList.contains('active')) return;

            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            }
        });
    }

    /* ==========================================================================
       6. PACKAGE SELECTOR & NAVIGATION INTERCONNECT
       ========================================================================== */
    const selectPackageButtons = document.querySelectorAll('.select-package-btn');
    const packageSelectDropdown = document.getElementById('packageSelect');

    selectPackageButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const packageName = btn.getAttribute('data-package');

            if (packageSelectDropdown) {
                packageSelectDropdown.value = packageName;
                validateField(packageSelectDropdown, true);

                // Trigger outline highlight animation
                packageSelectDropdown.focus();
                packageSelectDropdown.classList.add('highlight-flash');
                setTimeout(() => {
                    packageSelectDropdown.classList.remove('highlight-flash');
                }, 1500);
            }

            // Scroll smoothly to form section
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* ==========================================================================
       7. INTERACTIVE SCHEDULER: VISUAL CALENDAR WIDGET & TIME SLOTS
       ========================================================================== */
    const bookingDateInput = document.getElementById('bookingDate');
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    let selectedTimeSlot = ""; // No default selected value in UI

    // Shared key-value store (KeyValue API by Immanuel.co) to check slots globally
    const appKey = '2cax6glu';
    let globalBookedSlots = [];

    // Fetch globally booked slots on page load
    async function fetchGlobalBookedSlots() {
        try {
            const response = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${appKey}/booked_slots`);
            if (response.ok) {
                const data = await response.json();
                if (data && typeof data === 'string') {
                    globalBookedSlots = data.split(',').filter(Boolean);
                } else {
                    globalBookedSlots = [];
                }
                localStorage.setItem('global_booked_slots', JSON.stringify(globalBookedSlots));
            } else {
                globalBookedSlots = JSON.parse(localStorage.getItem('global_booked_slots') || '[]');
            }
        } catch (error) {
            console.error('Error fetching global booked slots:', error);
            globalBookedSlots = JSON.parse(localStorage.getItem('global_booked_slots') || '[]');
        }

        // Refresh disabled time slots if date is selected
        if (bookingDateInput && bookingDateInput.value) {
            updateDisabledTimeSlots(bookingDateInput.value);
        }
    }

    // Helper to format Date object to YYYY-MM-DD in local time
    function getLocalDateString(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Visual Calendar Widget Engine
    const calendarTrigger = document.getElementById('calendarTrigger');
    const calendarPopup = document.getElementById('calendarPopup');
    const selectedDateText = document.getElementById('selectedDateText');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const calendarDaysGrid = document.getElementById('calendarDays');
    const dateInputWrapper = document.querySelector('.date-input-wrapper');

    let calendarDate = new Date();
    let selectedDate = null; // No default selected date

    // Keep inputs unpopulated on startup
    if (bookingDateInput) {
        bookingDateInput.value = "";
    }
    if (selectedDateText) {
        selectedDateText.textContent = "Select Date...";
    }

    // Toggle Calendar Dropdown Popup
    if (calendarTrigger && calendarPopup) {
        calendarTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dateInputWrapper.classList.toggle('active');
            if (isActive) {
                fetchGlobalBookedSlots();
            }
        });

        // Close calendar popup if clicking outside
        document.addEventListener('click', (e) => {
            if (calendarPopup && !calendarPopup.contains(e.target) && e.target !== calendarTrigger && !calendarTrigger.contains(e.target)) {
                dateInputWrapper.classList.remove('active');
            }
        });
    }

    function renderCalendar() {
        if (!calendarDaysGrid || !currentMonthYearHeader) return;

        calendarDaysGrid.innerHTML = '';

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        // Month name & Year header text
        currentMonthYearHeader.textContent = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Find first day of the month & total days
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Today & Minimum selectable date (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minSelectableDate = new Date(today);

        // Add empty pads for calendar alignment
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarDaysGrid.appendChild(emptyCell);
        }

        // Generate day cells
        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);

            // Check if cell represents selected date
            if (selectedDate && cellDate.getTime() === selectedDate.getTime()) {
                dayCell.classList.add('selected');
            }

            // Check if cell is today
            if (cellDate.getTime() === today.getTime()) {
                dayCell.classList.add('today');
            }

            // Disable past dates
            if (cellDate < minSelectableDate) {
                dayCell.classList.add('disabled');
            } else {
                dayCell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedDate = cellDate;

                    // Update hidden native date input value for forms
                    bookingDateInput.value = getLocalDateString(cellDate);

                    // Trigger native change validation event
                    const event = new Event('change');
                    bookingDateInput.dispatchEvent(event);

                    // Update UI trigger label
                    selectedDateText.textContent = cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                    // Close popup
                    dateInputWrapper.classList.remove('active');

                    // Rerender cells to update selected state
                    renderCalendar();
                });
            }

            calendarDaysGrid.appendChild(dayCell);
        }
    }

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Disabled time slot helper
    function updateDisabledTimeSlots(dateString) {
        if (!dateString) return;
        const localBookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]');

        // Get today's local date string for time checks
        const today = new Date();
        const todayString = getLocalDateString(today);
        const currentHours = today.getHours();
        const currentMinutes = today.getMinutes();

        timeSlots.forEach(slot => {
            const time = slot.getAttribute('data-time');
            const slotKey = `${dateString}_${time}`;
            const safeSlotKey = slotKey.replace(/:/g, '-').replace(/ /g, '_');

            // Check if this slot time has already passed today
            let isPastSlot = false;
            if (dateString === todayString) {
                let slotHours = 0;
                let slotMinutes = 0;
                if (time === "09:00 AM") {
                    slotHours = 9;
                    slotMinutes = 0;
                } else if (time === "02:00 PM") {
                    slotHours = 14;
                    slotMinutes = 0;
                } else if (time === "05:30 PM") {
                    slotHours = 17;
                    slotMinutes = 30;
                }

                if (currentHours > slotHours || (currentHours === slotHours && currentMinutes >= slotMinutes)) {
                    isPastSlot = true;
                }
            }

            if (localBookedSlots.includes(slotKey) || globalBookedSlots.includes(safeSlotKey) || isPastSlot) {
                slot.classList.add('booked');
                slot.classList.remove('active');
            } else {
                slot.classList.remove('booked');
            }
        });

        // If a time slot was already selected but became booked, select the first available slot
        if (selectedTimeSlot) {
            const currentActiveSlot = Array.from(timeSlots).find(s => s.classList.contains('active'));
            if (!currentActiveSlot) {
                const firstAvailable = Array.from(timeSlots).find(s => !s.classList.contains('booked'));
                if (firstAvailable) {
                    firstAvailable.classList.add('active');
                    selectedTimeSlot = firstAvailable.getAttribute('data-time');
                } else {
                    selectedTimeSlot = ""; // All slots booked for this date
                }
            }
        } else {
            // Keep slot selection empty if none was selected
            timeSlots.forEach(s => s.classList.remove('active'));
        }
    }

    // Initialize calendar
    renderCalendar();

    // Fetch global bookings and sync
    fetchGlobalBookedSlots();

    // Initialize portfolio display on startup
    loadPortfolio();

    // Initial slots check
    if (bookingDateInput && bookingDateInput.value) {
        updateDisabledTimeSlots(bookingDateInput.value);
    }

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            if (slot.classList.contains('booked')) {
                showToast("This slot is already booked or unavailable!");
                return;
            }
            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            selectedTimeSlot = slot.getAttribute('data-time');
        });
    });

    /* ==========================================================================
       8. CLIENT TESTIMONIALS SLIDER CAROUSEL
       ========================================================================== */
    const testimonialSlider = document.getElementById('testimonialSlider');
    const sliderPrev = document.getElementById('sliderPrev');
    const sliderNext = document.getElementById('sliderNext');
    const sliderDotsContainer = document.getElementById('sliderDots');
    const slides = document.querySelectorAll('.testimonial-slide');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayTimer;

    // Dynamically calculate slider and slide widths based on total slides
    if (testimonialSlider && totalSlides > 0) {
        testimonialSlider.style.width = `${totalSlides * 100}%`;
        slides.forEach(slide => {
            slide.style.width = `${100 / totalSlides}%`;
        });
    }

    // Create Navigation Dots Dynamically
    if (sliderDotsContainer && totalSlides > 1) {
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to testimonial slide ${i + 1}`);
            dot.addEventListener('click', () => {
                goToSlide(i);
                resetAutoplay();
            });
            sliderDotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function goToSlide(slideIndex) {
        if (totalSlides === 0) return;
        currentSlide = slideIndex;
        // Shift testimonial width by percentages
        testimonialSlider.style.transform = `translateX(-${currentSlide * (100 / totalSlides)}%)`;
        updateDots();
    }

    function nextSlide() {
        if (totalSlides === 0) return;
        goToSlide((currentSlide + 1) % totalSlides);
    }

    function prevSlide() {
        if (totalSlides === 0) return;
        goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }

    function startAutoplay() {
        if (totalSlides <= 1) return;
        autoPlayTimer = setInterval(nextSlide, 6000); // Rotate review every 6s
    }

    function resetAutoplay() {
        clearInterval(autoPlayTimer);
        startAutoplay();
    }

    if (testimonialSlider && sliderNext && sliderPrev) {
        if (totalSlides > 1) {
            sliderNext.addEventListener('click', () => {
                nextSlide();
                resetAutoplay();
            });

            sliderPrev.addEventListener('click', () => {
                prevSlide();
                resetAutoplay();
            });

            // Initialize Slider
            startAutoplay();
        } else {
            // Hide controls if there's only 1 or 0 slides
            const sliderControls = document.querySelector('.slider-controls');
            if (sliderControls) {
                sliderControls.style.display = 'none';
            }
        }
    }

    /* ==========================================================================
       9. FORM VALIDATION & GORGEOUS TOAST SUBMISSION FEEDBACK
       ========================================================================== */
    const bookingForm = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('submitBookingBtn');

    // Toast Elements
    const toast = document.getElementById('toastNotification');
    const toastClose = document.getElementById('toastClose');
    const toastMessage = document.getElementById('toastMessage');

    // Validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(inputElement, isValid) {
        const parent = inputElement.closest('.form-group');
        if (parent) {
            if (isValid) {
                parent.classList.remove('invalid');
            } else {
                parent.classList.add('invalid');
            }
        }
    }

    function showToast(message) {
        if (!toast) return;
        toastMessage.textContent = message;
        toast.classList.add('active');

        // Auto dismiss after 6 seconds
        setTimeout(() => {
            toast.classList.remove('active');
        }, 6000);
    }

    if (toastClose) {
        toastClose.addEventListener('click', () => {
            toast.classList.remove('active');
        });
    }

    if (bookingForm) {
        // Real-time validations on blur
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');

        fullNameInput.addEventListener('blur', () => {
            validateField(fullNameInput, fullNameInput.value.trim() !== "");
        });

        emailInput.addEventListener('blur', () => {
            validateField(emailInput, emailPattern.test(emailInput.value.trim()));
        });

        if (packageSelectDropdown) {
            packageSelectDropdown.addEventListener('change', () => {
                validateField(packageSelectDropdown, packageSelectDropdown.value !== "");
            });
        }

        bookingDateInput.addEventListener('change', async () => {
            const dateVal = bookingDateInput.value;
            validateField(bookingDateInput, dateVal !== "");
            if (dateVal) {
                await fetchGlobalBookedSlots();
                updateDisabledTimeSlots(dateVal);
            }
        });

        // Form Submit
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isNameValid = fullNameInput.value.trim() !== "";
            const isEmailValid = emailPattern.test(emailInput.value.trim());
            const isDateValid = bookingDateInput.value !== "";
            const isPackageValid = packageSelectDropdown ? (packageSelectDropdown.value !== "") : true;

            validateField(fullNameInput, isNameValid);
            validateField(emailInput, isEmailValid);
            validateField(bookingDateInput, isDateValid);
            if (packageSelectDropdown) {
                validateField(packageSelectDropdown, isPackageValid);
            }

            // Halt if validation errors exist
            if (!isNameValid || !isEmailValid || !isDateValid || !isPackageValid) {
                return;
            }

            // Halt if no time slot is selected
            if (!selectedTimeSlot) {
                showToast("Please select a preferred time slot.");
                return;
            }

            // Halt if the selected date and slot are already booked
            const chosenDate = bookingDateInput.value;
            const slotKey = `${chosenDate}_${selectedTimeSlot}`;
            const safeSlotKey = slotKey.replace(/:/g, '-').replace(/ /g, '_');

            const localBookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]');
            if (localBookedSlots.includes(slotKey) || globalBookedSlots.includes(safeSlotKey)) {
                showToast("This date and time slot is already booked!");
                return;
            }

            // Halt if the selected slot is in the past
            const today = new Date();
            const todayString = getLocalDateString(today);
            if (chosenDate === todayString) {
                const currentHours = today.getHours();
                const currentMinutes = today.getMinutes();
                let slotHours = 0;
                let slotMinutes = 0;
                if (selectedTimeSlot === "09:00 AM") {
                    slotHours = 9;
                    slotMinutes = 0;
                } else if (selectedTimeSlot === "02:00 PM") {
                    slotHours = 14;
                    slotMinutes = 0;
                } else if (selectedTimeSlot === "05:30 PM") {
                    slotHours = 17;
                    slotMinutes = 30;
                }
                if (currentHours > slotHours || (currentHours === slotHours && currentMinutes >= slotMinutes)) {
                    showToast("This time slot has already passed today. Please select a future slot.");
                    return;
                }
            }

            // Fire Luxury Loading Animation on button
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Sync with global database first to ensure it's still available
            try {
                const checkResponse = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${appKey}/booked_slots`);
                let latestSlots = [];
                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    if (data && typeof data === 'string') {
                        latestSlots = data.split(',').filter(Boolean);
                    }
                }

                // If already booked by someone else in the meantime
                if (latestSlots.includes(safeSlotKey)) {
                    showToast("This slot was just booked by another client! Please choose another time.");
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    globalBookedSlots = latestSlots;
                    updateDisabledTimeSlots(chosenDate);
                    return;
                }

                // Book the slot
                latestSlots.push(safeSlotKey);
                const updatedData = latestSlots.join(',');
                const updateResponse = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${appKey}/booked_slots/${encodeURIComponent(updatedData)}`, {
                    method: 'POST',
                    headers: { 'Content-Length': '0' }
                });

                if (updateResponse.ok) {
                    globalBookedSlots = latestSlots;
                }
            } catch (err) {
                console.error("Failed to sync booking to cloud database:", err);
            }

            setTimeout(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;

                // Form values
                const name = fullNameInput.value.trim();
                const email = emailInput.value.trim();
                const selectedPkg = packageSelectDropdown.value;
                const creativeBrief = document.getElementById('projectVision').value.trim();

                // Save booked slot to localStorage
                const currentBookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]');
                if (!currentBookedSlots.includes(slotKey)) {
                    currentBookedSlots.push(slotKey);
                }
                localStorage.setItem('booked_slots', JSON.stringify(currentBookedSlots));

                // Format WhatsApp API redirect URL
                const waNumber = "7499032210";
                let waMessage = `Hello 404 Chronicles  ! I would like to book a photography session with 404 Chronicles.\n\n`;
                waMessage += `*Booking Details:*\n`;
                waMessage += `- *Name:* ${name}\n`;
                waMessage += `- *Email:* ${email}\n`;
                waMessage += `- *Package:* ${selectedPkg}\n`;
                waMessage += `- *Date:* ${chosenDate}\n`;
                waMessage += `- *Time:* ${selectedTimeSlot}\n`;
                if (creativeBrief) {
                    waMessage += `- *Creative Brief:* ${creativeBrief}\n`;
                }
                waMessage += `\nLooking forward to capturing the moment!`;

                const waUrl = `https://wa.me/91${waNumber}?text=${encodeURIComponent(waMessage)}`;

                // Success Message
                const successMsg = `Please send the info on WhatsApp to complete your booking.`;

                showToast(successMsg);

                // Open WhatsApp in a new tab
                setTimeout(() => {
                    window.open(waUrl, '_blank');
                }, 1000);

                // Reset form
                bookingForm.reset();
                timeSlots.forEach(s => s.classList.remove('active'));
                selectedTimeSlot = "";

                // Reset Visual Calendar trigger text
                if (selectedDateText) {
                    selectedDate = null;
                    calendarDate = new Date();
                    bookingDateInput.value = "";
                    selectedDateText.textContent = "Select Date...";
                    renderCalendar();
                }

                // Refresh slots display
                updateDisabledTimeSlots(bookingDateInput.value);

            }, 1000);
        });
    }

    /* ==========================================================================
       10. NEWSLETTER FORM HANDLER
       ========================================================================== */
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isEmailValid = emailPattern.test(newsletterEmail.value.trim());

            if (isEmailValid) {
                newsletterForm.classList.add('submitted');
                newsletterEmail.value = '';
                newsletterEmail.disabled = true;

                // Reset after 4 seconds
                setTimeout(() => {
                    newsletterForm.classList.remove('submitted');
                    newsletterEmail.disabled = false;
                }, 4000);
            } else {
                newsletterEmail.focus();
                newsletterEmail.style.borderColor = '#e55039';
                setTimeout(() => {
                    newsletterEmail.style.borderColor = '';
                }, 1500);
            }
        });
    }
});
