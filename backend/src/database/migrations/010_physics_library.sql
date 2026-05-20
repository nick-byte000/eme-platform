CREATE TABLE IF NOT EXISTS physics_library (
  id SERIAL PRIMARY KEY,
  chapter_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Physics',
  topics TEXT[] DEFAULT '{}',
  subtopics TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO physics_library (chapter_name, subject, topics, subtopics, sort_order) VALUES
('Motion in a Straight Line','Physics',ARRAY['Kinematics','Linear Motion'],ARRAY['Distance and Displacement','Speed and Velocity','Acceleration','Equations of Motion','Graphs of Motion','Relative Velocity'],1),
('Motion in a Plane','Physics',ARRAY['2D Motion','Projectile Motion'],ARRAY['Vectors','Projectile Motion','Uniform Circular Motion','Relative Velocity in 2D'],2),
('Newton''s Laws of Motion','Physics',ARRAY['Laws of Motion','Force and Motion','Dynamics'],ARRAY['First Law / Inertia','Second Law / F=ma','Third Law / Action-Reaction','Static Friction','Kinetic Friction','Normal Force','Pseudo Force','Circular Motion'],3),
('Work, Energy and Power','Physics',ARRAY['Work and Energy','Energy Conservation'],ARRAY['Work Done by a Force','Kinetic Energy','Potential Energy','Work-Energy Theorem','Conservation of Energy','Power','Collisions'],4),
('Rotational Motion','Physics',ARRAY['Rotational Dynamics','Angular Motion'],ARRAY['Torque','Moment of Inertia','Angular Momentum','Rolling Motion','Centre of Mass','Angular Acceleration'],5),
('Gravitation','Physics',ARRAY['Gravitation','Planetary Motion'],ARRAY['Universal Law of Gravitation','Gravitational Field','Escape Velocity','Orbital Velocity','Kepler''s Laws','Satellites'],6),
('Thermal Properties of Matter','Physics',ARRAY['Thermal Properties','Heat Transfer'],ARRAY['Thermal Expansion','Specific Heat','Calorimetry','Conduction','Convection','Radiation','Newton''s Law of Cooling'],7),
('Thermodynamics','Physics',ARRAY['Heat and Thermodynamics','Thermal Physics'],ARRAY['Zeroth Law','First Law of Thermodynamics','Second Law of Thermodynamics','Isothermal Process','Adiabatic Process','Carnot Engine','Entropy','Heat Engines'],8),
('Kinetic Theory of Gases','Physics',ARRAY['Kinetic Theory','Properties of Gases'],ARRAY['Ideal Gas Equation','Kinetic Energy of Molecules','Degrees of Freedom','Mean Free Path','Specific Heat Capacity'],9),
('Simple Harmonic Motion','Physics',ARRAY['Oscillations','SHM'],ARRAY['Displacement in SHM','Velocity and Acceleration','Energy in SHM','Spring-Mass System','Simple Pendulum','Damped Oscillations'],10),
('Waves','Physics',ARRAY['Waves and Sound','Mechanical Waves'],ARRAY['Transverse and Longitudinal Waves','Speed of a Wave','Superposition','Standing Waves','Beats','Doppler Effect','Sound Intensity'],11),
('Electrostatics','Physics',ARRAY['Electrostatics','Electric Fields'],ARRAY['Coulomb''s Law','Electric Field','Electric Potential','Gauss''s Law','Capacitors','Dielectrics','Electric Flux'],12),
('Current Electricity','Physics',ARRAY['Current Electricity','Electric Circuits'],ARRAY['Ohm''s Law','Resistance','Kirchhoff''s Laws','Wheatstone Bridge','EMF and Internal Resistance','Electric Power','RC Circuits'],13),
('Magnetic Effects of Current','Physics',ARRAY['Magnetism','Magnetic Effects'],ARRAY['Biot-Savart Law','Ampere''s Law','Force on a Conductor','Torque on Current Loop','Moving Coil Galvanometer','Solenoid'],14),
('Electromagnetic Induction','Physics',ARRAY['EMI','Faraday''s Laws'],ARRAY['Faraday''s Law','Lenz''s Law','Motional EMF','Self Induction','Mutual Induction','Transformers','AC Generators'],15),
('Alternating Current','Physics',ARRAY['AC Circuits','Alternating Current'],ARRAY['RMS Values','AC with Resistor','AC with Inductor','AC with Capacitor','LCR Circuit','Resonance','Power Factor'],16),
('Electromagnetic Waves','Physics',ARRAY['EM Waves','Electromagnetic Spectrum'],ARRAY['Properties of EM Waves','EM Spectrum','Speed of Light','Polarization','Displacement Current'],17),
('Optics - Ray Optics','Physics',ARRAY['Ray Optics','Geometrical Optics'],ARRAY['Reflection','Refraction','Total Internal Reflection','Prism','Lenses','Mirror Formula','Lens Formula','Magnification','Optical Instruments'],18),
('Optics - Wave Optics','Physics',ARRAY['Wave Optics','Physical Optics'],ARRAY['Huygen''s Principle','Interference','Young''s Double Slit Experiment','Diffraction','Polarization'],19),
('Modern Physics','Physics',ARRAY['Modern Physics','Quantum Physics'],ARRAY['Photoelectric Effect','de Broglie Wavelength','Bohr''s Model','Hydrogen Spectrum','X-Rays','Nuclear Fission & Fusion','Radioactivity','Semiconductors','Logic Gates'],20),
('Units and Measurements','Physics',ARRAY['Measurement','Units'],ARRAY['SI Units','Dimensional Analysis','Significant Figures','Error Analysis','Vernier Callipers','Screw Gauge'],21)
ON CONFLICT (chapter_name) DO NOTHING;
