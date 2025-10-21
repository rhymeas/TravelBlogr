import React, { useState } from 'react';
import { Car, Train, Bike, Plane, Bus, Shuffle, ChevronDown, Plus, MapPin, Calendar, Clock } from 'lucide-react';

const TravelPlannerRedesign = () => {
  const [view, setView] = useState('planning'); // 'planning' or 'itinerary'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    start: 'Paris',
    end: 'Rome',
    stops: ['Lyon'],
    transportMode: 'roadtrip',
    dates: { from: '2025-10-25', to: '2025-10-30' },
    companions: 'couple',
    travelPace: 4,
    tripType: '',
    budget: '',
    accommodation: [],
    travelStyle: []
  });

  const transportModes = [
    { id: 'car', icon: Car },
    { id: 'train', icon: Train },
    { id: 'bike', icon: Bike },
    { id: 'flight', icon: Plane },
    { id: 'bus', icon: Bus },
    { id: 'mixed', icon: Shuffle }
  ];

  // Mock itinerary data
  const itinerary = [
    {
      day: 1,
      date: 'Oct 25',
      location: 'Paris → Lyon',
      distance: '465 km',
      duration: '4h 30min',
      stops: [
        { time: '09:00', title: 'Depart Paris', type: 'departure' },
        { time: '11:30', title: 'Beaune Wine Tasting', type: 'stop', duration: '1h 30min' },
        { time: '14:00', title: 'Arrive Lyon', type: 'arrival' }
      ],
      accommodation: 'Hôtel Le Royal Lyon',
      activities: ['Explore Vieux Lyon', 'Dinner at Paul Bocuse']
    },
    {
      day: 2,
      date: 'Oct 26',
      location: 'Lyon',
      stops: [
        { time: '09:00', title: 'Basilique Notre-Dame', type: 'activity' },
        { time: '12:00', title: 'Lunch at Les Halles', type: 'activity' },
        { time: '15:00', title: 'Parc de la Tête d\'Or', type: 'activity' }
      ],
      accommodation: 'Hôtel Le Royal Lyon'
    },
    {
      day: 3,
      date: 'Oct 27',
      location: 'Lyon → Florence',
      distance: '645 km',
      duration: '6h 15min',
      stops: [
        { time: '08:00', title: 'Depart Lyon', type: 'departure' },
        { time: '12:00', title: 'Turin lunch break', type: 'stop', duration: '1h 30min' },
        { time: '16:00', title: 'Arrive Florence', type: 'arrival' }
      ],
      accommodation: 'Hotel Brunelleschi',
      activities: ['Evening walk to Ponte Vecchio']
    }
  ];

  if (view === 'itinerary') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-xl font-semibold">TravelBlogr</div>
            <nav className="flex items-center gap-8">
              <button onClick={() => setView('planning')} className="text-gray-700 hover:text-black font-medium">Edit trip</button>
              <a href="#" className="text-gray-700 hover:text-black">Blog</a>
              <a href="#" className="text-gray-700 hover:text-black">Trips</a>
              <button className="px-5 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-medium">
                Share Itinerary
              </button>
            </nav>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold mb-2">Paris to Rome Road Trip</h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Oct 25 - Oct 30, 2025
              </span>
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Road trip
              </span>
              <span>5 days • 2 travelers</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6" style={{height: 'calc(100vh - 220px)'}}>
            {/* Left Panel - Day by Day Itinerary */}
            <div className="bg-white rounded-lg shadow-sm overflow-auto">
              {itinerary.map((day) => (
                <div key={day.day} className="border-b border-gray-100 last:border-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl font-semibold">Day {day.day}</span>
                          <span className="text-sm text-gray-500">{day.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {day.location}
                        </div>
                      </div>
                      {day.distance && (
                        <div className="text-right text-sm">
                          <div className="font-medium">{day.distance}</div>
                          <div className="text-gray-500">{day.duration}</div>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 ml-2">
                      {day.stops.map((stop, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${
                              stop.type === 'departure' ? 'border-2 border-gray-400' :
                              stop.type === 'arrival' ? 'bg-emerald-600' :
                              'bg-gray-400'
                            }`}></div>
                            {idx < day.stops.length - 1 && (
                              <div className="w-px h-8 bg-gray-200 my-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-sm">{stop.title}</div>
                                {stop.duration && (
                                  <div className="text-xs text-gray-500 mt-0.5">{stop.duration}</div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{stop.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {day.accommodation && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Accommodation</div>
                        <div className="text-sm font-medium">{day.accommodation}</div>
                      </div>
                    )}

                    {day.activities && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Activities</div>
                        <div className="flex flex-wrap gap-2">
                          {day.activities.map((activity, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Panel - Map */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center" style={{aspectRatio: '1/1'}}>
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-emerald-700" />
                </div>
                <p className="text-gray-500 font-medium mb-2">Interactive Route Map</p>
                <p className="text-sm text-gray-400">Paris → Lyon → Florence → Rome</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold">TravelBlogr</div>
          <nav className="flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-black font-medium">Plan your trip</a>
            <a href="#" className="text-gray-700 hover:text-black">Blog</a>
            <a href="#" className="text-gray-700 hover:text-black">Trips</a>
            <button className="px-5 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-medium">
              Share Your Journey
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-1">Plan your trip</h1>
        </div>

        <div className="grid grid-cols-2 gap-6" style={{height: 'calc(100vh - 200px)'}}>
          {/* Left Panel - Compact Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-auto">
            <div className="space-y-5">
              {/* Where to */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Where to?</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Starting location"
                    value={formData.start}
                    onChange={(e) => setFormData({...formData, start: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    placeholder="Destination"
                    value={formData.end}
                    onChange={(e) => setFormData({...formData, end: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <button className="text-xs text-gray-600 hover:text-black flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add stop
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Dates</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.dates.from}
                    onChange={(e) => setFormData({...formData, dates: {...formData.dates, from: e.target.value}})}
                    className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="date"
                    value={formData.dates.to}
                    onChange={(e) => setFormData({...formData, dates: {...formData.dates, to: e.target.value}})}
                    className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Transport */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Transport</h3>
                <div className="grid grid-cols-6 gap-2">
                  {transportModes.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setFormData({...formData, transportMode: mode.id})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.transportMode === mode.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel Pace - Compact */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Travel pace</h3>
                  <span className="text-lg font-bold">{formData.travelPace}h/day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={formData.travelPace}
                  onChange={(e) => setFormData({...formData, travelPace: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Relaxed</span>
                  <span>Intensive</span>
                </div>
              </div>

              {/* More Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2.5 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-black transition-colors text-sm font-medium"
              >
                More options
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {/* Advanced Options - Compact */}
              {showAdvanced && (
                <div className="space-y-4 pt-2 animate-slide-down">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Who's traveling?</h3>
                    <select
                      value={formData.companions}
                      onChange={(e) => setFormData({...formData, companions: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    >
                      <option value="solo">Solo</option>
                      <option value="couple">Couple</option>
                      <option value="family">Family</option>
                      <option value="friends">Friends</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Budget per day</h3>
                    <select className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black">
                      <option>Budget ($30-60)</option>
                      <option>Mid-range ($60-120)</option>
                      <option>Comfortable ($120-200)</option>
                      <option>Luxury ($200+)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* CTAs - Sticky at bottom of form */}
            <div className="sticky bottom-0 pt-5 mt-6 -mx-6 px-6 pb-6 bg-white border-t border-gray-100">
              <button 
                onClick={() => setView('itinerary')}
                className="w-full py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors mb-2"
              >
                Generate trip plan
              </button>
              <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-900 transition-colors">
                Manual planning
              </button>
            </div>
          </div>

          {/* Right Panel - Square Map */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center" style={{aspectRatio: '1/1'}}>
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <MapPin className="w-12 h-12 text-emerald-700" />
              </div>
              <p className="text-gray-500 font-medium mb-2">Your route preview</p>
              {formData.start && formData.end && (
                <p className="text-sm text-gray-400">{formData.start} → {formData.end}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #047857;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #047857;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default TravelPlannerRedesign;