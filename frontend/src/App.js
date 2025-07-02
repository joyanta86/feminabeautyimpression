import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sessionId, setSessionId] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/gallery`);
      if (response.ok) {
        const images = await response.json();
        setGalleryImages(images);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdminToken(data.access_token);
        localStorage.setItem('adminToken', data.access_token);
        setShowAdminLogin(false);
        setShowAdminPanel(true);
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const file = e.target.image.files[0];
    const description = e.target.description.value;

    formData.append('file', file);
    formData.append('description', description);

    try {
      const response = await fetch(`${backendUrl}/api/gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('Image uploaded successfully!');
        fetchGalleryImages();
        e.target.reset();
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { text: chatInput, sender: 'user' };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatInput, session_id: sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = { text: data.response, sender: 'bot' };
        setChatMessages(prev => [...prev, botMessage]);
        setSessionId(data.session_id);
      } else {
        const errorMessage = { text: 'Sorry, I had trouble processing your message. Please try again.', sender: 'bot' };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { text: 'Sorry, I had trouble connecting. Please try again.', sender: 'bot' };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setChatInput('');
  };

  const services = [
    {
      category: "Threading",
      items: [
        { service: "Eye Brow", price: "£5" },
        { service: "Upper Lip", price: "£3" },
        { service: "Chin", price: "£3" },
        { service: "Forehead", price: "£3" },
        { service: "Neck", price: "£3" },
        { service: "Side Face", price: "£5" },
        { service: "Full Face", price: "£15" }
      ]
    },
    {
      category: "Face Waxing",
      items: [
        { service: "Eye Brows", price: "£6" },
        { service: "Upper Lip", price: "£4" },
        { service: "Chin", price: "£4" },
        { service: "Forehead", price: "£4" },
        { service: "Neck", price: "£4" },
        { service: "Side Face", price: "£6" },
        { service: "Full Face", price: "£18" }
      ]
    },
    {
      category: "Body Waxing",
      items: [
        { service: "Half Arm", price: "£12" },
        { service: "Full Arm", price: "£18" },
        { service: "Under Arm", price: "£8" },
        { service: "Half Leg", price: "£15" },
        { service: "Full Leg", price: "£25" },
        { service: "Full Body (Except Bikini)", price: "£60" }
      ]
    },
    {
      category: "Pedicure & Manicure",
      items: [
        { service: "Pedicure", price: "£25" },
        { service: "Manicure", price: "£20" }
      ]
    },
    {
      category: "Eyelash & Tinting",
      items: [
        { service: "Full Set Cluster", price: "From £18" },
        { service: "Party Lashes", price: "£8" },
        { service: "Eye Brows Tinting", price: "£6" },
        { service: "Eye Lashes Tinting", price: "£8" }
      ]
    },
    {
      category: "Facial & Massage",
      items: [
        { service: "Mini Facial", price: "£15" },
        { service: "Full Facial (Cleansing/Whitening/Gold)", price: "£25" },
        { service: "Herbal Facial", price: "£30" },
        { service: "Head Massage (With/Without Herbal Oil)", price: "£15" }
      ]
    },
    {
      category: "Henna & Hair",
      items: [
        { service: "One Hand / Foot Henna", price: "From £5" },
        { service: "Both Hands / Feet Henna", price: "From £10" },
        { service: "Hair Trimming", price: "£7" },
        { service: "Any Other Cut", price: "From £12" },
        { service: "Children (Under 10)", price: "£10" }
      ]
    },
    {
      category: "Makeup",
      items: [
        { service: "Party Makeup", price: "From £30" },
        { service: "Bridal Makeup", price: "From £150" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-pink-600">Femina Beauty Impression</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
              >
                💬 Chat Assistant
              </button>
              <button
                onClick={() => setShowAdminLogin(true)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Your Beauty Journey Starts Here
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Professional beauty services including threading, waxing, facials, and makeup. 
                Experience the finest beauty treatments in a relaxing environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#services"
                  className="bg-pink-500 text-white px-8 py-3 rounded-lg hover:bg-pink-600 transition-colors text-center"
                >
                  View Services
                </a>
                <a
                  href="tel:+447368594210"
                  className="bg-white text-pink-500 border-2 border-pink-500 px-8 py-3 rounded-lg hover:bg-pink-50 transition-colors text-center"
                >
                  📞 Book Appointment
                </a>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/4621787/pexels-photo-4621787.jpeg"
                alt="Beauty Salon Professional Service"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Professional beauty treatments with competitive pricing</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-pink-600 mb-4">{category.category}</h3>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.service}</span>
                      <span className="font-semibold text-pink-500">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Work Gallery</h2>
            <p className="text-xl text-gray-600">See our beautiful work and transformations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryImages.length > 0 ? (
              galleryImages.map((image) => (
                <div key={image.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${image.image_data}`}
                    alt={image.description}
                    className="w-full h-64 object-cover"
                  />
                  {image.description && (
                    <div className="p-4">
                      <p className="text-gray-600">{image.description}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/5128078/pexels-photo-5128078.jpeg"
                      alt="Eyebrow Threading Service"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Eyebrow Threading</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/4621787/pexels-photo-4621787.jpeg"
                      alt="Facial Massage Service"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Facial & Massage</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/7561210/pexels-photo-7561210.jpeg"
                      alt="Manicure Service"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Manicure & Pedicure</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/8751788/pexels-photo-8751788.jpeg"
                      alt="Beauty Tools"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Professional Tools</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/4621783/pexels-photo-4621783.jpeg"
                      alt="Spa Treatment"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Spa Treatments</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1630843599725-32ead7671867?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxtYW5pY3VyZXxlbnwwfHx8d2hpdGV8MTc1MTQ0NTI2Mnww&ixlib=rb-4.1.0&q=85"
                      alt="Nail Art"
                      className="rounded-lg shadow-lg w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-lg">
                      <p className="text-white font-semibold">Nail Art & Design</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Sample gallery showcasing our professional beauty services</p>
                  <p className="text-sm text-gray-400 mt-2">Admin can upload actual work photos through the admin panel</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Visit Us</h2>
            <p className="text-xl text-gray-600">Book your appointment today</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 text-pink-500 mt-1">📍</div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Location</p>
                    <p className="text-gray-600">21-23 Woodgrange Road<br />London E7 8BA<br />(Inside Post Office)</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 text-pink-500 mt-1">🕐</div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Opening Hours</p>
                    <p className="text-gray-600">Monday - Saturday<br />11:00 AM to 6:00 PM</p>
                    <p className="text-sm text-gray-500 mt-2">
                      10:00 AM - 11:00 AM: By appointment only<br />
                      6:00 PM - 7:00 PM: By appointment only
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 text-pink-500 mt-1">📞</div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">+44 7368 594210</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 text-pink-500 mt-1">🌐</div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Follow Us</p>
                    <div className="flex space-x-4 mt-2">
                      <a
                        href="https://www.facebook.com/profile.php?id=100066574856943"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Facebook
                      </a>
                      <a
                        href="https://www.instagram.com/feminabeautyimpression1?igsh=MXB1MHNjdjVscGhoZg%3D%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <img
                src="https://images.unsplash.com/photo-1653840930195-883ed17af14c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxzcGElMjB0cmVhdG1lbnR8ZW58MHx8fHdoaXRlfDE3NTE0NDM5ODB8MA&ixlib=rb-4.1.0&q=85"
                alt="Beauty Treatment"
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book Your Appointment</h3>
              <p className="text-gray-600 mb-6">
                Call us or visit our social media pages to book your appointment. 
                We offer flexible timing and professional services.
              </p>
              <a
                href="tel:+447368594210"
                className="w-full bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors inline-block text-center"
              >
                📞 Call Now: +44 7368 594210
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Femina Beauty Impression</h3>
            <p className="text-gray-400 mb-4">Your trusted beauty destination in London</p>
            <p className="text-gray-500">© 2025 Femina Beauty Impression. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
            <h3 className="text-2xl font-bold mb-6">Admin Login</h3>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
            <h3 className="text-2xl font-bold mb-6">Admin Panel</h3>
            <form onSubmit={handleImageUpload}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  rows="3"
                  placeholder="Describe the work..."
                ></textarea>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdminPanel(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
                >
                  Upload Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="bg-pink-500 text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-bold">Beauty Assistant</h4>
              <button
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="text-gray-500 text-sm">
                Hello! I'm here to help with beauty tips and salon information. Ask me anything!
              </div>
            )}
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-2 rounded-lg max-w-xs ${
                    message.sender === 'user'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about beauty tips or location..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="bg-pink-500 text-white px-4 py-2 rounded-r-lg hover:bg-pink-600"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;