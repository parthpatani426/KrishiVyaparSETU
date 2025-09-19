// ---- Simple Math Captcha Fallback ----
let captcha = { a: 0, b: 0 };
function generateCaptcha() {
  captcha.a = Math.floor(Math.random() * 10) + 1;
  captcha.b = Math.floor(Math.random() * 10) + 1;
  const q = document.getElementById("captchaQuestion");
  if (q) q.textContent = `${captcha.a} + ${captcha.b} = ?`;
function validateCaptcha() {
  const ansField = document.getElementById("captchaAnswer");
  if (!ansField) return true; // no captcha present
  const val = parseInt(ansField.value || "0", 10);
  return val === captcha.a + captcha.b;
}

// ---- reCAPTCHA (optional) ----
// If a site key is provided, we can render reCAPTCHA v2 checkbox dynamically.
function renderRecaptcha(siteKey) {
  const container = document.getElementById("recaptcha-container");
  if (!container || !siteKey) return;

  // Create a placeholder element
  const box = document.createElement("div");
  box.id = "recaptcha-box";
  container.appendChild(box);

  // Require global grecaptcha if script is included by the page.
  const wait = setInterval(() => {
    if (window.grecaptcha && window.grecaptcha.render) {
      clearInterval(wait);
      window.grecaptcha.render("recaptcha-box", {
        sitekey: siteKey,
        callback: function (token) {
          const t = document.getElementById("recaptchaToken");
          if (t) t.value = token;
        },
        "expired-callback": function () {
          const t = document.getElementById("recaptchaToken");
          if (t) t.value = "";
        },
      });
    }
  }, 200);
}

// ---- Role-specific field toggling & validation ----
function toggleRoleFields(role) {
  const farmer = document.getElementById("farmerFields");
  const trader = document.getElementById("traderFields");

  if (farmer && trader) {
    if (role === "farmer") {
      farmer.classList.remove("d-none");
      trader.classList.add("d-none");
      // Set required attributes appropriately
      document.getElementById("primaryCrop").setAttribute("required", "true");
      document.getElementById("farmerDocs").setAttribute("required", "true");
      document.getElementById("businessName").removeAttribute("required");
      document.getElementById("traderDocs").removeAttribute("required");
    } else if (role === "trader") {
      trader.classList.remove("d-none");
      farmer.classList.add("d-none");
      document.getElementById("businessName").setAttribute("required", "true");
      document.getElementById("traderDocs").setAttribute("required", "true");
      document.getElementById("primaryCrop").removeAttribute("required");
      document.getElementById("farmerDocs").removeAttribute("required");
    } else {
      farmer.classList.add("d-none");
      trader.classList.add("d-none");
    }
  }
}

// ---- Camera Authentication ----
let cameraStream = null;
const video = document.getElementById('cameraFeed');
const canvas = document.getElementById('cameraCanvas');
const captureImageButton = document.getElementById('captureImageButton');
const startCameraButton = document.getElementById('startCameraButton');
const capturedImagePreview = document.getElementById('capturedImagePreview');
const capturedImageContainer = document.getElementById('capturedImageContainer');
const capturedImageDataInput = document.getElementById('capturedImageData');
const cameraAuthFeedback = document.getElementById('cameraAuthFeedback');

async function startCamera() {
  try {
    const constraints = { video: { facingMode: 'user' } }; // Use front camera
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = cameraStream;
    video.play();
    startCameraButton.textContent = 'Camera On';
    startCameraButton.disabled = true;
    captureImageButton.disabled = false;
    cameraAuthFeedback.style.display = 'none'; // Hide feedback on success
  } catch (err) {
    console.error("Error accessing camera: ", err);
    alert("Could not access camera. Please ensure you have a camera and have granted permissions.");
    cameraAuthFeedback.textContent = "Camera access denied or not available.";
    cameraAuthFeedback.style.display = 'block';
  }
}

function captureImage() {
  if (!cameraStream) {
    alert("Camera not started.");
    return;
  }

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageDataURL = canvas.toDataURL('image/png');
  capturedImagePreview.src = imageDataURL;
  capturedImageDataInput.value = imageDataURL; // Store image data in a hidden input
  capturedImageContainer.style.display = 'block';
  cameraAuthFeedback.style.display = 'none'; // Hide feedback on successful capture

  // Stop camera after capturing
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    startCameraButton.textContent = 'Start Camera';
    startCameraButton.disabled = false;
    captureImageButton.disabled = true;
  }
}

// ---- OTP Verification ----
let isMobileVerified = false;
let otpSentMobile = ''; // To store the mobile number for which OTP was sent

async function sendOtp() {
  const mobileInput = document.getElementById('mobile');
  const mobile = mobileInput.value.trim();
  const otpVerificationSection = document.getElementById('otpVerificationSection');
  const sendOtpButton = document.getElementById('sendOtpButton');
  const otpFeedback = document.getElementById('otpFeedback');
  const otpInput = document.getElementById('otpInput');
  const verifyOtpButton = document.getElementById('verifyOtpButton');

  if (!mobile || mobile.length !== 10 || !mobileInput.checkValidity()) {
    mobileInput.classList.add('is-invalid');
    alert("Please enter a valid 10-digit mobile number first.");
    return;
  }
  mobileInput.classList.remove('is-invalid');

  otpSentMobile = mobile; // Store for verification
  isMobileVerified = false; // Reset verification status

  // Show OTP section
  otpVerificationSection.classList.remove('d-none');
  sendOtpButton.disabled = true; // Prevent multiple OTP requests immediately
  otpFeedback.textContent = "Sending OTP...";
  otpFeedback.style.color = 'inherit'; // Reset color

  try {
    // Simulate backend API call for sending OTP
    // In a real app, this would be a fetch() call to your backend
    const response = await new Promise(resolve => setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      resolve({
        ok: success,
        json: () => Promise.resolve({ message: success ? "OTP sent" : "Failed to send OTP" })
      });
    }, 1500)); // Simulate network delay

    const result = await response.json();

    if (response.ok) {
      otpFeedback.textContent = "OTP sent to your mobile number. Please enter it below.";
      otpFeedback.style.color = 'green';
      otpInput.disabled = false; // Enable OTP input
      verifyOtpButton.disabled = otpInput.value.length !== 6; // Enable verify button if OTP already typed
      otpInput.focus();
    } else {
      otpFeedback.textContent = `Failed to send OTP: ${result.message || 'Server error'}`;
      otpFeedback.style.color = 'red';
      sendOtpButton.disabled = false; // Allow retry
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    otpFeedback.textContent = "Network error. Please try again.";
    otpFeedback.style.color = 'red';
    sendOtpButton.disabled = false; // Allow retry
  }
}

async function verifyOtp() {
  const otpInput = document.getElementById('otpInput');
  const otp = otpInput.value.trim();
  const verifyOtpButton = document.getElementById('verifyOtpButton');
  const otpFeedback = document.getElementById('otpFeedback');

  if (!otp || otp.length !== 6 || !otpInput.checkValidity()) {
    otpInput.classList.add('is-invalid');
    alert("Please enter a valid 6-digit OTP.");
    return;
  }
  otpInput.classList.remove('is-invalid');

  if (otpSentMobile === '') {
    alert("Please send an OTP first.");
    return;
  }

  verifyOtpButton.disabled = true;
  otpFeedback.textContent = "Verifying OTP...";
  otpFeedback.style.color = 'inherit'; // Reset color

  try {
    // Simulate backend API call for verifying OTP
    // In a real app, this would be a fetch() call to your backend
    const response = await new Promise(resolve => setTimeout(() => {
      // For demo: OTP "123456" is successful
      const success = (otp === "123456");
      resolve({
        ok: success,
        json: () => Promise.resolve({ verified: success, message: success ? "OTP verified" : "Invalid OTP" })
      });
    }, 1500)); // Simulate network delay

    const result = await response.json();

    if (response.ok && result.verified) {
      otpFeedback.textContent = "Mobile number verified successfully!";
      otpFeedback.style.color = 'green';
      isMobileVerified = true; // Set flag
      // Disable OTP section after successful verification
      otpInput.disabled = true;
      document.getElementById('sendOtpButton').disabled = true;
      verifyOtpButton.disabled = true;
      // Optionally hide the OTP section or show a checkmark
    } else {
      otpFeedback.textContent = `OTP verification failed: ${result.message || 'Invalid OTP'}`;
      otpFeedback.style.color = 'red';
      verifyOtpButton.disabled = false; // Allow retry
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    otpFeedback.textContent = "Network error during OTP verification. Please try again.";
    otpFeedback.style.color = 'red';
    verifyOtpButton.disabled = false; // Allow retry
  }
}


// ---- Form init and submission ----
function initRegistrationEnhancements({ recaptchaSiteKey = "" } = {}) {
  // Init captcha
  generateCaptcha();
  // Attach event listener to refresh button for math captcha
  const refreshCaptchaBtn = document.querySelector('#captchaBlock .btn-outline-secondary');
  if (refreshCaptchaBtn) {
    refreshCaptchaBtn.addEventListener('click', generateCaptcha);
  }

  renderRecaptcha(recaptchaSiteKey);

  // Role change handler
  const roleSel = document.getElementById("role");
  if (roleSel) {
    roleSel.addEventListener("change", (e) => toggleRoleFields(e.target.value));
  }

  // Camera button event listeners
  if (startCameraButton) {
    startCameraButton.addEventListener('click', startCamera);
  }
  if (captureImageButton) {
    captureImageButton.addEventListener('click', captureImage);
  }

  // OTP button event listeners
  const sendOtpButton = document.getElementById('sendOtpButton');
  const verifyOtpButton = document.getElementById('verifyOtpButton');
  const otpInput = document.getElementById('otpInput');
  const mobileInput = document.getElementById('mobile');
  const otpVerificationSection = document.getElementById('otpVerificationSection');

  if (sendOtpButton) {
    sendOtpButton.addEventListener('click', sendOtp);
  }
  if (verifyOtpButton) {
    verifyOtpButton.addEventListener('click', verifyOtp);
  }
  // Enable verify button when OTP is typed
  if (otpInput) {
    otpInput.addEventListener('input', () => {
      verifyOtpButton.disabled = otpInput.value.length !== 6;
    });
  }
  // Show OTP section when mobile number is typed
  if (mobileInput) {
    mobileInput.addEventListener('input', () => {
      if (mobileInput.value.length === 10 && mobileInput.checkValidity()) {
        otpVerificationSection.classList.remove('d-none');
        sendOtpButton.disabled = false; // Enable send OTP button
      } else {
        otpVerificationSection.classList.add('d-none');
        sendOtpButton.disabled = true;
        isMobileVerified = false; // Reset verification status if mobile changes
      }
    });
  }


  // Form validation & submit behavior
  const form = document.getElementById("registerForm");
  if (form) {
    form.addEventListener("submit", function (event) {
      // Custom validation for camera image
      const capturedImage = document.getElementById('capturedImageData').value;
      if (!capturedImage) {
        event.preventDefault();
        event.stopPropagation();
        cameraAuthFeedback.textContent = "Please capture an image for human verification.";
        cameraAuthFeedback.style.display = 'block';
        form.classList.add("was-validated"); // Trigger Bootstrap validation styles
        return;
      } else {
        cameraAuthFeedback.style.display = 'none';
      }

      // Custom validation for OTP
      if (!isMobileVerified) {
        event.preventDefault();
        event.stopPropagation();
        const otpFeedback = document.getElementById('otpFeedback');
        otpFeedback.textContent = "Please verify your mobile number with OTP.";
        otpFeedback.style.color = 'red';
        otpVerificationSection.classList.remove('d-none'); // Ensure OTP section is visible
        form.classList.add("was-validated");
        return;
      }


      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        form.classList.add("was-validated");
        return;
      }

      // If reCAPTCHA site key is configured, expect a token
      const siteKeyUsed = !!recaptchaSiteKey;
      if (siteKeyUsed) {
        const token = (document.getElementById("recaptchaToken") || {}).value || "";
        if (!token) {
          event.preventDefault();
          event.stopPropagation();
          alert("Please complete reCAPTCHA.");
          return;
        }
      } else {
        // Fallback simple captcha
        if (!validateCaptcha()) {
          event.preventDefault();
          event.stopPropagation();
          alert("Captcha answer is incorrect. Please try again.");
          return;
        }
      }

      // Basic file presence check for role-specific docs
      const role = document.getElementById("role").value;
      if (role === "farmer") {
        const f = document.getElementById("farmerDocs");
        if (!f || !f.files || f.files.length === 0) {
          event.preventDefault();
          event.stopPropagation();
          alert("Please upload land/ID proof.");
          return;
        }
      }
      if (role === "trader") {
        const t = document.getElementById("traderDocs");
        if (!t || !t.files || t.files.length === 0) {
          event.preventDefault();
          event.stopPropagation();
          alert("Please upload business/ID proof.");
          return;
        }
      }

      // Aadhaar safe note: do not process the Offline eKYC ZIP here.
      // Backend must handle decryption/validation with user consent.

      event.preventDefault();
      // Simulate success
      alert("Registration submitted successfully (demo). Replace with backend API.");
      // In a real application, you would collect all form data and send it to your backend here:
      
      /*const formData = new FormData(form);
      fetch('/api/register', {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert("Registration successful!");
              window.location.href = "login.html";
          } else {
              alert("Registration failed: " + data.message);
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert("An error occurred during registration.");
      });*/
      
       Optionallyredirect:
      window.location.href = "login.html";
    })
  }
}

// Expose init function globally
window.initRegistrationEnhancements = initRegistrationEnhancements;
window.generateCaptcha = generateCaptcha; // Expose for direct call from HTML if needed

// assets/app.js

// Logout function for Farmer/Trader dashboards
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// Handle login redirection
let selectedRole = null;
function setRole(role) {
  selectedRole = role;
  const farmerButton = document.querySelector(".role-button:nth-child(1)");
  const traderButton = document.querySelector(".role-button:nth-child(2)");

  if (role === "farmer") {
    farmerButton.classList.add("selected");
    traderButton.classList.remove("selected");
  } else if (role === "trader") {
    traderButton.classList.add("selected");
    farmerButton.classList.remove("selected");
  }
}

function handleLogin(event) {
  event.preventDefault();
  if (!selectedRole) {
    alert("Please select a role first!");
    return;
  }

  if (selectedRole === "farmer") {
    window.location.href = "farmer-dashboard.html";
  } else if (selectedRole === "trader") {
    window.location.href = "trader-dashboard.html";
  } else {
    window.location.href = "index.html";
  }
}

// Register page dynamic background
function changeBackground(role) {
  const card = document.querySelector(".register-card");
  if (!card) return;

  if (role === "farmer") {
    card.style.backgroundImage = "url('assets/images/farmer-bg.jpeg')";
  } else if (role === "trader") {
    card.style.backgroundImage = "url('assets/images/trader-bg.png')";
  } else {
    card.style.backgroundImage = "none";
  }
}
}