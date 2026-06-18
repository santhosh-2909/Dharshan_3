/**
 * Aalayam Bilingual Support (English / Tamil)
 * Provides a language toggle that swaps all [data-i18n] text and saves preference.
 */

const I18N = {
  // Navigation
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.dashboard': { en: 'Dashboard', ta: 'கட்டுப்பாட்டு பலகை' },
  'nav.prediction': { en: 'Prediction', ta: 'கணிப்பு' },
  'nav.events': { en: 'Events', ta: 'நிகழ்வுகள்' },
  'nav.bookings': { en: 'Bookings', ta: 'முன்பதிவுகள்' },
  'nav.donations': { en: 'Donations', ta: 'நன்கொடைகள்' },
  'nav.parking': { en: 'Parking', ta: 'வாகன நிறுத்தம்' },
  'nav.signin': { en: 'Sign In', ta: 'உள்நுழை' },
  'nav.logout': { en: 'Logout', ta: 'வெளியேறு' },
  'nav.heatmap': { en: 'Heatmap', ta: 'வெப்ப வரைபடம்' },
  'nav.surge': { en: 'Surge', ta: 'எழுச்சி' },
  'nav.staffing': { en: 'Staffing', ta: 'பணியாளர்' },
  'nav.anomaly': { en: 'Anomaly', ta: 'முரண்பாடு' },
  'nav.faq': { en: 'FAQ', ta: 'கேள்விகள்' },
  'nav.cctv': { en: 'CCTV Monitor', ta: 'CCTV கண்காணிப்பு' },
  'nav.report': { en: 'Daily Report', ta: 'தினசரி அறிக்கை' },

  // Common
  'common.home': { en: 'Home', ta: 'முகப்பு' },
  'common.loading': { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  'common.submit': { en: 'Submit', ta: 'சமர்ப்பி' },
  'common.cancel': { en: 'Cancel', ta: 'ரத்து' },
  'common.total': { en: 'Total', ta: 'மொத்தம்' },
  'common.status': { en: 'Status', ta: 'நிலை' },
  'common.action': { en: 'Action', ta: 'செயல்' },
  'common.date': { en: 'Date', ta: 'தேதி' },
  'common.amount': { en: 'Amount', ta: 'தொகை' },
  'common.name': { en: 'Name', ta: 'பெயர்' },

  // Footer
  'footer.tagline': { en: 'Preserving Heritage through Intelligence.', ta: 'நுண்ணறிவின் மூலம் பாரம்பரியத்தைப் பாதுகாத்தல்.' },
  'footer.tagline2': { en: 'Preserving Heritage through Intelligence. Bridging monumental legacy with modern precision.', ta: 'நுண்ணறிவின் மூலம் பாரம்பரியத்தைப் பாதுகாத்தல். நினைவுச்சின்ன மரபுரிமையை நவீன துல்லியத்துடன் இணைத்தல்.' },
  'footer.platform': { en: 'Platform', ta: 'தளம்' },
  'footer.more': { en: 'More', ta: 'மேலும்' },
  'footer.contact': { en: 'Contact', ta: 'தொடர்பு' },

  // ===== Landing Page (index.html) =====
  'hero.label': { en: 'Aalayam', ta: 'ஆலயம்' },
  'hero.title': { en: 'Predict Temple Crowds 21 Days Ahead', ta: 'கோயில் கூட்டத்தை 21 நாட்களுக்கு முன்பே கணிக்கவும்' },
  'hero.desc': { en: 'Preserving the sanctity of the darshan experience through museum-grade minimal AI. Centralized intelligence for monument management.', ta: 'அருங்காட்சியக தரமான AI மூலம் தரிசன அனுபவத்தின் புனிதத்தைப் பாதுகாத்தல். நினைவுச்சின்ன மேலாண்மைக்கான மையப்படுத்தப்பட்ட நுண்ணறிவு.' },
  'hero.forecast_btn': { en: 'View Forecast', ta: 'கணிப்பைக் காண்க' },
  'hero.dashboard_btn': { en: 'Explore Dashboard', ta: 'கட்டுப்பாட்டு பலகையை ஆராய்க' },
  'hero.tomorrow': { en: "Tomorrow's Forecast", ta: 'நாளைய கணிப்பு' },
  'hero.expected_visitors': { en: 'Expected Visitors', ta: 'எதிர்பார்க்கப்படும் பார்வையாளர்கள்' },
  'hero.capacity': { en: '78% Capacity', ta: '78% கொள்ளளவு' },
  'hero.risk': { en: 'Risk Level: Medium', ta: 'ஆபத்து நிலை: மிதமான' },

  // Temple Feature
  'temple.name': { en: 'Brihadeeswarer Temple, Thanjavur', ta: 'பிரகதீஸ்வரர் கோயில், தஞ்சாவூர்' },
  'temple.desc': { en: 'A UNESCO World Heritage Site and a timeless masterpiece of Chola architecture. Aalayam empowers temple authorities with AI-driven insights to ensure smooth crowd management while preserving heritage.', ta: 'யுனெஸ்கோ உலக பாரம்பரிய தளமும் சோழ கட்டிடக்கலையின் காலமற்ற படைப்புமான இது. Aalayam பாரம்பரியத்தைப் பாதுகாக்கும் அதே வேளையில் சுமூகமான கூட்ட மேலாண்மையை உறுதிசெய்ய AI சார்ந்த நுண்ணறிவுகளுடன் கோயில் நிர்வாகிகளை வலுப்படுத்துகிறது.' },
  'temple.explore': { en: 'Explore the Temple', ta: 'கோயிலை ஆராய்க' },

  // Stats Bar
  'stats.today_footfall': { en: "Today's Footfall", ta: 'இன்றைய பாதயாத்திரை' },
  'stats.live_count': { en: 'Live Count', ta: 'நேரடி எண்ணிக்கை' },
  'stats.next_high_risk': { en: 'Next High Risk Day', ta: 'அடுத்த அதிக ஆபத்து நாள்' },
  'stats.days_left': { en: '18 Days Left', ta: '18 நாட்கள் மீதம்' },
  'stats.predicted_21': { en: 'Predicted (21 Days)', ta: 'கணிப்பு (21 நாட்கள்)' },
  'stats.peak_footfall': { en: 'Peak Footfall', ta: 'உச்ச பாதயாத்திரை' },
  'stats.model_accuracy': { en: 'Model Accuracy', ta: 'மாதிரி துல்லியம்' },
  'stats.confidence': { en: 'Confidence Score', ta: 'நம்பகத்தன்மை மதிப்பெண்' },

  // AI Features
  'features.title': { en: 'AI-Powered Features', ta: 'AI இயக்கும் அம்சங்கள்' },
  'features.heatmap': { en: 'Crowd Density Heatmap', ta: 'கூட்ட அடர்த்தி வெப்ப வரைபடம்' },
  'features.heatmap_desc': { en: 'Real-time crowd density visualization across temple zones.', ta: 'கோயில் மண்டலங்களில் நிகழ்நேர கூட்ட அடர்த்தி காட்சிப்படுத்தல்.' },
  'features.surge': { en: 'Festival Surge Predictor', ta: 'திருவிழா எழுச்சி கணிப்பான்' },
  'features.surge_desc': { en: 'Predict upcoming festival surges and be prepared.', ta: 'வரவிருக்கும் திருவிழா எழுச்சிகளைக் கணித்து தயாராகுங்கள்.' },
  'features.queue': { en: 'Queue Wait Time Estimator', ta: 'வரிசை காத்திருப்பு நேர மதிப்பீட்டாளர்' },
  'features.queue_desc': { en: 'Get estimated wait times for each entry gate.', ta: 'ஒவ்வொரு நுழைவாயிலுக்கும் மதிப்பிடப்பட்ட காத்திருப்பு நேரத்தைப் பெறுங்கள்.' },
  'features.staff': { en: 'Staff Deployment Recommender', ta: 'பணியாளர் நிலைப்படுத்தல் பரிந்துரைப்பவர்' },
  'features.staff_desc': { en: 'AI-powered staff scheduling for maximum efficiency.', ta: 'அதிகபட்ச செயல்திறனுக்கான AI இயக்கும் பணியாளர் அட்டவணை.' },
  'features.anomaly': { en: 'Anomaly Alert', ta: 'முரண்பாடு எச்சரிக்கை' },
  'features.anomaly_desc': { en: 'Get alerted when actual footfall deviates from predictions.', ta: 'உண்மையான பாதயாத்திரை கணிப்புகளிலிருந்து விலகும்போது எச்சரிக்கை பெறுங்கள்.' },

  // Quote
  'quote.text': { en: '" Where devotion meets intelligence, management becomes a service. "', ta: '" பக்தி நுண்ணறிவைச் சந்திக்கும் இடத்தில், மேலாண்மை ஒரு சேவையாக மாறுகிறது. "' },
  'quote.attr': { en: '- Aalayam Mission', ta: '- Aalayam நோக்கம்' },

  // CTA
  'cta.title': { en: 'Begin Your Digital Darshan', ta: 'உங்கள் டிஜிட்டல் தரிசனத்தைத் தொடங்குங்கள்' },
  'cta.dashboard': { en: 'Explore Dashboard', ta: 'கட்டுப்பாட்டு பலகையை ஆராய்க' },
  'cta.book': { en: 'Book a Seva', ta: 'சேவை முன்பதிவு' },

  // ===== Dashboard =====
  'dash.title': { en: 'Live Crowd Dashboard', ta: 'நேரடி கூட்ட கட்டுப்பாட்டு பலகை' },
  'dash.subtitle': { en: 'Real-time crowd monitoring and 7-day forecast', ta: 'நிகழ்நேர கூட்ட கண்காணிப்பு மற்றும் 7 நாள் கணிப்பு' },
  'dash.current_visitors': { en: 'Current Visitors', ta: 'தற்போதைய பார்வையாளர்கள்' },
  'dash.today_forecast': { en: "Today's Forecast", ta: 'இன்றைய கணிப்பு' },
  'dash.capacity': { en: 'Capacity', ta: 'கொள்ளளவு' },
  'dash.crowd_band': { en: 'Crowd Band', ta: 'கூட்ட நிலை' },
  'dash.active_bookings': { en: 'Active Bookings', ta: 'செயலில் முன்பதிவுகள்' },
  'dash.occupancy': { en: 'Occupancy', ta: 'நிரம்பல்' },
  'dash.7day': { en: '7-Day Forecast', ta: '7 நாள் கணிப்பு' },
  'dash.hourly': { en: "Today's Hourly Curve", ta: 'இன்றைய மணிநேர வளைவு' },

  // ===== Prediction =====
  'predict.title': { en: '21-Day Crowd Predictor', ta: '21 நாள் கூட்ட கணிப்பான்' },
  'predict.subtitle': { en: 'AI-powered daily crowd forecast for temple planning', ta: 'கோயில் திட்டமிடலுக்கான AI இயக்கும் தினசரி கூட்ட கணிப்பு' },
  'predict.target_date': { en: 'Target Date', ta: 'இலக்கு தேதி' },
  'predict.confidence': { en: 'Confidence Range', ta: 'நம்பகத்தன்மை வரம்பு' },
  'predict.suggestions': { en: 'Resource Suggestions', ta: 'வள பரிந்துரைகள்' },
  'predict.prev_years': { en: 'Previous Years Comparison', ta: 'முந்தைய ஆண்டுகள் ஒப்பீடு' },
  'predict.notes': { en: 'Analysis Notes', ta: 'பகுப்பாய்வு குறிப்புகள்' },
  'predict.select_date': { en: 'Select a Date', ta: 'ஒரு தேதியைத் தேர்ந்தெடுக்கவும்' },
  'predict.get_prediction': { en: 'Get Prediction', ta: 'கணிப்பைப் பெறு' },
  'predict.predicted_count': { en: 'Predicted Count', ta: 'கணிக்கப்பட்ட எண்ணிக்கை' },
  'predict.capacity_pct': { en: 'Capacity %', ta: 'கொள்ளளவு %' },
  'predict.crowd_band': { en: 'Crowd Band', ta: 'கூட்ட நிலை' },
  'predict.best_time': { en: 'Best Time to Visit', ta: 'சிறந்த நேரம்' },

  // ===== Heatmap =====
  'heatmap.title': { en: 'Live Crowd Density Heatmap', ta: 'நேரடி கூட்ட அடர்த்தி வெப்ப வரைபடம்' },
  'heatmap.subtitle': { en: 'Temple premises zones color-coded by predicted crowd density', ta: 'கணிக்கப்பட்ட கூட்ட அடர்த்தியின்படி நிறக்குறியீடு செய்யப்பட்ட கோயில் வளாக மண்டலங்கள்' },
  'heatmap.total': { en: 'Total on Premises', ta: 'வளாகத்தில் மொத்தம்' },
  'heatmap.layout': { en: 'Temple Premises Layout', ta: 'கோயில் வளாக அமைப்பு' },
  'heatmap.zone_details': { en: 'Zone Occupancy Details', ta: 'மண்டல நிரம்பல் விவரங்கள்' },
  'heatmap.calm': { en: 'Calm', ta: 'அமைதி' },
  'heatmap.moderate': { en: 'Moderate', ta: 'மிதம்' },
  'heatmap.high': { en: 'High', ta: 'அதிகம்' },
  'heatmap.veryhigh': { en: 'Very High', ta: 'மிக அதிகம்' },
  'heatmap.refresh': { en: 'Auto-refreshes every', ta: 'ஒவ்வொரு முறையும் தானாக புதுப்பிக்கும்' },
  'heatmap.minutes': { en: 'minutes', ta: 'நிமிடங்கள்' },

  // ===== Surge / Festival =====
  'surge.title': { en: 'Festival Surge Predictor', ta: 'திருவிழா எழுச்சி கணிப்பான்' },
  'surge.subtitle': { en: 'Predicted footfall surge for upcoming festivals with countdown', ta: 'வரவிருக்கும் திருவிழாக்களுக்கான கணிக்கப்பட்ட பாதயாத்திரை எழுச்சி' },
  'surge.next_high': { en: 'Next High-Risk Day', ta: 'அடுத்த அதிக ஆபத்து நாள்' },
  'surge.all_upcoming': { en: 'All Upcoming Festivals & Events', ta: 'வரவிருக்கும் அனைத்து திருவிழாக்கள் & நிகழ்வுகள்' },
  'surge.days': { en: 'Days', ta: 'நாட்கள்' },
  'surge.hours': { en: 'Hours', ta: 'மணி' },
  'surge.mins': { en: 'Mins', ta: 'நிமி' },
  'surge.secs': { en: 'Secs', ta: 'வினா' },
  'surge.predicted': { en: 'Predicted', ta: 'கணிப்பு' },
  'surge.normal': { en: 'Normal Day', ta: 'சாதாரண நாள்' },
  'surge.surge_pct': { en: 'Surge', ta: 'எழுச்சி' },
  'surge.risk': { en: 'Risk', ta: 'ஆபத்து' },
  'surge.prev': { en: 'Prev', ta: 'முந்தைய' },
  'surge.next': { en: 'Next', ta: 'அடுத்த' },
  'surge.cal_sun': { en: 'Sun', ta: 'ஞா' },
  'surge.cal_mon': { en: 'Mon', ta: 'தி' },
  'surge.cal_tue': { en: 'Tue', ta: 'செ' },
  'surge.cal_wed': { en: 'Wed', ta: 'பு' },
  'surge.cal_thu': { en: 'Thu', ta: 'வி' },
  'surge.cal_fri': { en: 'Fri', ta: 'வெ' },
  'surge.cal_sat': { en: 'Sat', ta: 'ச' },

  // ===== Queue =====
  'queue.title': { en: 'Queue & Wait Time', ta: 'வரிசை & காத்திருப்பு நேரம்' },
  'queue.subtitle': { en: 'Estimated waiting times at each entry gate', ta: 'ஒவ்வொரு நுழைவாயிலிலும் மதிப்பிடப்பட்ட காத்திருப்பு நேரம்' },
  'queue.redirect': { en: 'Redirect Here', ta: 'இங்கே திருப்பி விடுங்கள்' },
  'queue.total_queue': { en: 'Total in Queue', ta: 'வரிசையில் மொத்தம்' },
  'queue.on_premises': { en: 'On Premises', ta: 'வளாகத்தில்' },
  'queue.throughput': { en: 'Throughput/min', ta: 'செயல்திறன்/நிமி' },
  'queue.gates_open': { en: 'Gates Open', ta: 'திறந்த வாயில்கள்' },
  'queue.minutes': { en: 'minutes', ta: 'நிமிடங்கள்' },
  'queue.closed': { en: 'Closed', ta: 'மூடப்பட்டது' },
  'queue.best_choice': { en: 'Best Choice', ta: 'சிறந்த தேர்வு' },
  'queue.gate_map': { en: 'Gate Positions', ta: 'வாயில் நிலைகள்' },
  'queue.comparison': { en: 'Queue Length Comparison', ta: 'வரிசை நீள ஒப்பீடு' },
  'queue.best_time': { en: 'Best Time to Visit', ta: 'சிறந்த நேரம்' },
  'queue.tip1': { en: 'Early morning (6:00 - 7:30 AM) typically has the shortest queues', ta: 'அதிகாலை (6:00 - 7:30 AM) பொதுவாக குறுகிய வரிசைகளைக் கொண்டுள்ளது' },
  'queue.tip2': { en: 'Avoid peak hours (10:00 AM - 12:00 PM and 5:00 - 7:00 PM)', ta: 'உச்ச நேரங்களைத் தவிர்க்கவும் (10:00 AM - 12:00 PM மற்றும் 5:00 - 7:00 PM)' },
  'queue.tip3': { en: 'Weekdays are generally less crowded than weekends', ta: 'வாரநாட்கள் பொதுவாக வார இறுதி நாட்களை விட குறைவான கூட்டம்' },
  'queue.tip4': { en: 'Use the Prediction page to check crowd forecast before your visit', ta: 'உங்கள் வருகைக்கு முன் கூட்ட கணிப்பைச் சரிபார்க்க கணிப்பு பக்கத்தைப் பயன்படுத்தவும்' },
  'queue.toggle_label': { en: 'Toggle gates open/closed to simulate:', ta: 'உருவகப்படுத்த வாயில்களை திறந்த/மூடிய நிலையை மாற்றவும்:' },
  'queue.people_in_queue': { en: 'people in queue', ta: 'வரிசையில் உள்ளவர்கள்' },

  // ===== Staffing =====
  'staff.title': { en: 'Staff Deployment Recommender', ta: 'பணியாளர் நிலைப்படுத்தல் பரிந்துரைப்பவர்' },
  'staff.subtitle': { en: 'AI-recommended staffing based on predicted footfall', ta: 'கணிக்கப்பட்ட பாதயாத்திரையின் அடிப்படையில் AI பரிந்துரைக்கும் பணியாளர்கள்' },
  'staff.current_needed': { en: 'Current Staff Needed', ta: 'தற்போது தேவையான பணியாளர்கள்' },
  'staff.peak_needed': { en: 'Peak Staff Needed', ta: 'உச்ச பணியாளர்கள் தேவை' },
  'staff.peak_hour': { en: 'Peak Hour', ta: 'உச்ச மணி' },
  'staff.total_roles': { en: 'Total Roles', ta: 'மொத்த பணிகள்' },
  'staff.hourly': { en: 'Hourly Staff Requirement', ta: 'மணிநேர பணியாளர் தேவை' },
  'staff.shift': { en: 'Shift Schedule', ta: 'பணி அட்டவணை' },
  'staff.export': { en: 'Export PDF', ta: 'PDF ஏற்றுமதி' },
  'staff.horizon': { en: 'Forecast Horizon', ta: 'முன்கணிப்பு கால அளவு' },
  'staff.update': { en: 'Update', ta: 'புதுப்பி' },
  'staff.th_role': { en: 'Role', ta: 'பணி' },
  'staff.th_location': { en: 'Location', ta: 'இடம்' },
  'staff.th_shift': { en: 'Shift', ta: 'பணி நேரம்' },
  'staff.th_staff': { en: 'Staff', ta: 'பணியாளர்' },
  'staff.th_crowd_band': { en: 'Crowd Band', ta: 'கூட்ட நிலை' },
  'staff.next3': { en: 'Next 3 Hours', ta: 'அடுத்த 3 மணி' },
  'staff.next6': { en: 'Next 6 Hours', ta: 'அடுத்த 6 மணி' },
  'staff.next9': { en: 'Next 9 Hours', ta: 'அடுத்த 9 மணி' },
  'staff.next12': { en: 'Next 12 Hours', ta: 'அடுத்த 12 மணி' },

  // ===== Anomaly =====
  'anomaly.title': { en: 'Anomaly Alert', ta: 'முரண்பாடு எச்சரிக்கை' },
  'anomaly.subtitle': { en: '\u201CSomething\'s Off Today\u201D \u2014 Real-time deviation monitoring', ta: '\u201Cஇன்று ஏதோ மாறுதல்\u201D \u2014 நிகழ்நேர விலகல் கண்காணிப்பு' },
  'anomaly.manual': { en: 'Manual Gate Count', ta: 'கைமுறை வாயில் எண்ணிக்கை' },
  'anomaly.actual': { en: 'Actual People Count', ta: 'உண்மையான மக்கள் எண்ணிக்கை' },
  'anomaly.source': { en: 'Source', ta: 'ஆதாரம்' },
  'anomaly.check': { en: 'Check for Anomaly', ta: 'முரண்பாட்டை சோதி' },
  'anomaly.expected': { en: 'Expected', ta: 'எதிர்பார்ப்பு' },
  'anomaly.actual_label': { en: 'Actual', ta: 'உண்மை' },
  'anomaly.deviation': { en: 'Deviation', ta: 'விலகல்' },
  'anomaly.status': { en: 'Current Status', ta: 'தற்போதைய நிலை' },
  'anomaly.history': { en: 'Recent Checks', ta: 'சமீபத்திய சோதனைகள்' },
  'anomaly.cctv_fill': { en: 'Auto-fill from CCTV', ta: 'CCTV-யிலிருந்து தானாக நிரப்பு' },
  'anomaly.how_it_works': { en: 'How it works', ta: 'இது எப்படி வேலை செய்கிறது' },
  'anomaly.enter_count': { en: 'Enter the observed people count from manual gate counting or sensors', ta: 'கைமுறை வாயில் எண்ணிக்கை அல்லது சென்சார்களிலிருந்து கவனிக்கப்பட்ட மக்கள் எண்ணிக்கையை உள்ளிடவும்' },
  'anomaly.src_manual': { en: 'Manual Gate Count', ta: 'கைமுறை வாயில் எண்ணிக்கை' },
  'anomaly.src_sensor': { en: 'Gate Sensor', ta: 'வாயில் சென்சார்' },
  'anomaly.src_cctv': { en: 'CCTV Estimate', ta: 'CCTV மதிப்பீடு' },
  'anomaly.normal_desc': { en: 'Normal', ta: 'இயல்பு' },
  'anomaly.watch_desc': { en: 'Watch', ta: 'கவனி' },
  'anomaly.alert_desc': { en: 'Alert', ta: 'எச்சரிக்கை' },
  'anomaly.normal_range': { en: 'within \u00B125% of forecast', ta: 'கணிப்பின் \u00B125% க்குள்' },
  'anomaly.watch_range': { en: '25-40% deviation detected', ta: '25-40% விலகல் கண்டறியப்பட்டது' },
  'anomaly.alert_range': { en: '>40% deviation, action needed', ta: '>40% விலகல், நடவடிக்கை தேவை' },

  // ===== CCTV =====
  'cctv.title': { en: 'CCTV People Counter', ta: 'CCTV மக்கள் எண்ணிக்கையாளர்' },
  'cctv.subtitle': { en: 'AI-powered crowd detection from temple cameras (YOLOv8 + OpenCV)', ta: 'கோயில் கேமராக்களிலிருந்து AI இயக்கும் கூட்ட கண்டறிதல்' },
  'cctv.total_today': { en: 'Total Today', ta: 'இன்று மொத்தம்' },
  'cctv.current': { en: 'Current Count', ta: 'தற்போதைய எண்ணிக்கை' },
  'cctv.last_hour': { en: 'Last Hour', ta: 'கடந்த மணி' },
  'cctv.cameras': { en: 'Cameras Online', ta: 'இணைப்பில் கேமராக்கள்' },
  'cctv.start': { en: 'Start Camera', ta: 'கேமரா தொடங்கு' },
  'cctv.stop': { en: 'Stop Camera', ta: 'கேமரா நிறுத்து' },
  'cctv.density': { en: 'Crowd Density', ta: 'கூட்ட அடர்த்தி' },
  'cctv.hourly': { en: 'Hourly People Count', ta: 'மணிநேர மக்கள் எண்ணிக்கை' },
  'cctv.recent': { en: 'Recent Detections', ta: 'சமீபத்திய கண்டறிதல்கள்' },
  'cctv.live_vs_forecast': { en: 'Live vs Forecast', ta: 'நேரடி vs கணிப்பு' },
  'cctv.current_count': { en: 'Current Count', ta: 'தற்போதைய எண்ணிக்கை' },
  'cctv.predicted_today': { en: 'Predicted Today', ta: 'இன்றைய கணிப்பு' },
  'cctv.remaining': { en: 'Remaining Expected', ta: 'எதிர்பார்க்கப்படும் மீதி' },
  'cctv.occupancy': { en: 'Occupancy', ta: 'நிரம்பல்' },
  'cctv.autopoll': { en: 'Auto-poll live count every 5s', ta: 'ஒவ்வொரு 5 வினாடிக்கும் தானாக நேரடி எண்ணிக்கை' },
  'cctv.camera_offline': { en: 'Camera Offline', ta: 'கேமரா இணைப்பில்லை' },
  'cctv.camera_not_active': { en: 'Camera Not Active', ta: 'கேமரா செயலில் இல்லை' },
  'cctv.click_start': { en: 'Click "Start Camera" to begin live YOLOv8 detection', ta: '"கேமரா தொடங்கு" என்பதை கிளிக் செய்யவும்' },
  'cctv.th_time': { en: 'Time', ta: 'நேரம்' },
  'cctv.th_camera': { en: 'Camera', ta: 'கேமரா' },
  'cctv.th_people': { en: 'People Count', ta: 'மக்கள் எண்ணிக்கை' },

  // ===== Bookings =====
  'book.title': { en: 'Book a Seva', ta: 'சேவை முன்பதிவு' },
  'book.subtitle': { en: 'Reserve your pooja slot online', ta: 'உங்கள் பூஜை நேரத்தை ஆன்லைனில் முன்பதிவு செய்யுங்கள்' },
  'book.available': { en: 'Available Sevas', ta: 'கிடைக்கும் சேவைகள்' },
  'book.my_bookings': { en: 'My Bookings', ta: 'எனது முன்பதிவுகள்' },
  'book.confirm': { en: 'Confirm Booking', ta: 'முன்பதிவை உறுதிப்படுத்து' },
  'book.select_date': { en: 'Select Date', ta: 'தேதியைத் தேர்ந்தெடு' },
  'book.select_slot': { en: 'Select Time Slot', ta: 'நேர இடைவெளியைத் தேர்ந்தெடு' },
  'book.date': { en: 'Date', ta: 'தேதி' },
  'book.devotees': { en: 'Number of Devotees', ta: 'பக்தர்கள் எண்ணிக்கை' },
  'book.select_seva': { en: 'Select a seva to begin booking', ta: 'முன்பதிவைத் தொடங்க ஒரு சேவையைத் தேர்ந்தெடுக்கவும்' },
  'book.signin_prompt': { en: 'Sign in to view your bookings', ta: 'உங்கள் முன்பதிவுகளைப் பார்க்க உள்நுழையவும்' },
  'book.th_reference': { en: 'Reference', ta: 'குறிப்பு எண்' },
  'book.th_seva': { en: 'Seva', ta: 'சேவை' },
  'book.th_date': { en: 'Date', ta: 'தேதி' },
  'book.th_devotees': { en: 'Devotees', ta: 'பக்தர்கள்' },
  'book.th_amount': { en: 'Amount', ta: 'தொகை' },
  'book.th_status': { en: 'Status', ta: 'நிலை' },

  // ===== Donations =====
  'donate.title': { en: 'Make a Donation', ta: 'நன்கொடை வழங்கு' },
  'donate.subtitle': { en: "Support the temple's spiritual and charitable activities", ta: 'கோயிலின் ஆன்மீக மற்றும் அறச்செயல்களுக்கு ஆதரவு' },
  'donate.details': { en: 'Donation Details', ta: 'நன்கொடை விவரங்கள்' },
  'donate.recent': { en: 'Recent Donations', ta: 'சமீபத்திய நன்கொடைகள்' },
  'donate.now': { en: 'Donate Now', ta: 'இப்போது நன்கொடை' },
  'donate.amount': { en: 'Amount (\u20B9)', ta: 'தொகை (\u20B9)' },
  'donate.cause': { en: 'Purpose / Cause', ta: 'நோக்கம் / காரணம்' },
  'donate.name': { en: 'Donor Name', ta: 'நன்கொடையாளர் பெயர்' },

  // ===== Parking =====
  'park.title': { en: 'Parking Status', ta: 'வாகன நிறுத்த நிலை' },
  'park.subtitle': { en: 'Real-time parking lot availability', ta: 'நிகழ்நேர வாகன நிறுத்த இடம் கிடைக்கும் நிலை' },
  'park.available': { en: 'Available', ta: 'கிடைக்கிறது' },
  'park.occupied': { en: 'Occupied', ta: 'நிரம்பியுள்ளது' },
  'park.total_spots': { en: 'Total Spots', ta: 'மொத்த இடங்கள்' },
  'park.vehicles_entered': { en: 'Vehicles Entered', ta: 'நுழைந்த வாகனங்கள்' },
  'park.currently_parked': { en: 'Currently Parked', ta: 'தற்போது நிறுத்தப்பட்டுள்ளது' },
  'park.available_slots': { en: 'Available Slots', ta: 'கிடைக்கும் இடங்கள்' },
  'park.occupancy': { en: 'Occupancy', ta: 'நிரம்பல்' },
  'park.zones': { en: 'Parking Zones', ta: 'வாகன நிறுத்த மண்டலங்கள்' },
  'park.register': { en: 'Register Vehicle Entry', ta: 'வாகன நுழைவைப் பதிவு செய்' },
  'park.active_vehicles': { en: 'Active Vehicles', ta: 'செயலில் வாகனங்கள்' },
  'park.lot': { en: 'Parking Lot', ta: 'வாகன நிறுத்த இடம்' },
  'park.vehicle_number': { en: 'Vehicle Number', ta: 'வாகன எண்' },
  'park.vehicle_type': { en: 'Vehicle Type', ta: 'வாகன வகை' },
  'park.owner_name': { en: 'Owner Name', ta: 'உரிமையாளர் பெயர்' },
  'park.contact': { en: 'Contact', ta: 'தொடர்பு' },
  'park.register_btn': { en: 'Register Entry', ta: 'நுழைவைப் பதிவு செய்' },
  'park.th_vehicle': { en: 'Vehicle', ta: 'வாகனம்' },
  'park.th_type': { en: 'Type', ta: 'வகை' },
  'park.th_owner': { en: 'Owner', ta: 'உரிமையாளர்' },
  'park.th_entered': { en: 'Entered', ta: 'நுழைந்தது' },
  'park.th_action': { en: 'Action', ta: 'செயல்' },

  // ===== Events =====
  'events.title': { en: 'Temple Events & Festivals', ta: 'கோயில் நிகழ்வுகள் & திருவிழாக்கள்' },
  'events.subtitle': { en: 'Upcoming religious events, festivals and special poojas', ta: 'வரவிருக்கும் மத நிகழ்வுகள், திருவிழாக்கள் மற்றும் சிறப்பு பூஜைகள்' },
  'events.upcoming': { en: 'Upcoming Events', ta: 'வரவிருக்கும் நிகழ்வுகள்' },
  'events.past': { en: 'Past Events', ta: 'கடந்த நிகழ்வுகள்' },
  'events.all': { en: 'All Events', ta: 'அனைத்து நிகழ்வுகள்' },
  'events.festivals': { en: 'Festivals', ta: 'திருவிழாக்கள்' },

  // ===== History =====
  'history.title': { en: 'Historical Trends', ta: 'வரலாற்றுப் போக்குகள்' },
  'history.subtitle': { en: 'Past crowd data and footfall patterns', ta: 'கடந்தகால கூட்ட தரவு மற்றும் பாதயாத்திரை முறைகள்' },
  'history.total_days': { en: 'Total Days', ta: 'மொத்த நாட்கள்' },
  'history.avg_people': { en: 'Avg People/Day', ta: 'சராசரி மக்கள்/நாள்' },
  'history.peak_day': { en: 'Peak Day', ta: 'உச்ச நாள்' },
  'history.th_date': { en: 'Date', ta: 'தேதி' },
  'history.th_people': { en: 'People', ta: 'மக்கள்' },
  'history.th_vehicles': { en: 'Vehicles', ta: 'வாகனங்கள்' },
  'history.th_bookings': { en: 'Bookings', ta: 'முன்பதிவுகள்' },
  'history.th_devotees': { en: 'Devotees', ta: 'பக்தர்கள்' },
  'history.th_donations': { en: 'Donations (\u20B9)', ta: 'நன்கொடைகள் (\u20B9)' },
  'history.th_predicted': { en: 'Predicted', ta: 'கணிப்பு' },
  'history.th_festival': { en: 'Festival', ta: 'திருவிழா' },

  // ===== Feedback =====
  'feedback.title': { en: 'Share Your Experience', ta: 'உங்கள் அனுபவத்தைப் பகிருங்கள்' },
  'feedback.subtitle': { en: 'Help us improve your darshan experience', ta: 'உங்கள் தரிசன அனுபவத்தை மேம்படுத்த எங்களுக்கு உதவுங்கள்' },
  'feedback.name': { en: 'Your Name', ta: 'உங்கள் பெயர்' },
  'feedback.message': { en: 'Message', ta: 'செய்தி' },
  'feedback.rating': { en: 'Rating', ta: 'மதிப்பீடு' },
  'feedback.form_title': { en: 'Submit Feedback', ta: 'கருத்தை சமர்ப்பிக்கவும்' },
  'feedback.submit': { en: 'Submit Feedback', ta: 'கருத்தை சமர்ப்பி' },
  'feedback.recent': { en: 'Recent Reviews', ta: 'சமீபத்திய மதிப்புரைகள்' },

  // ===== FAQ =====
  'faq.title': { en: 'Frequently Asked Questions', ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்' },
  'faq.subtitle': { en: 'Common questions about Aalayam', ta: 'Aalayam பற்றிய பொதுவான கேள்விகள்' },

  // ===== Report =====
  'report.title': { en: 'Daily Report', ta: 'தினசரி அறிக்கை' },
  'report.subtitle': { en: 'Comprehensive daily temple operations summary', ta: 'விரிவான தினசரி கோயில் செயல்பாடுகள் சுருக்கம்' },
  'report.total_crowd': { en: 'Overall Total Crowd', ta: 'ஒட்டுமொத்த கூட்டம்' },
  'report.peak_hour': { en: 'Peak Hour', ta: 'உச்ச மணி' },
  'report.parking_est': { en: 'Parking Estimation', ta: 'வாகன நிறுத்த மதிப்பீடு' },
  'report.cctv_detect': { en: 'CCTV Detection', ta: 'CCTV கண்டறிதல்' },
  'report.booking_dev': { en: 'Booking Devotees', ta: 'முன்பதிவு பக்தர்கள்' },
  'report.sources': { en: 'Sources', ta: 'ஆதாரங்கள்' },
  'report.summary': { en: 'Summary Insights', ta: 'சுருக்க நுண்ணறிவுகள்' },

  // ===== Login =====
  'login.title': { en: 'Sign In', ta: 'உள்நுழை' },
  'login.subtitle': { en: 'Access your bookings and more', ta: 'உங்கள் முன்பதிவுகள் மற்றும் பலவற்றை அணுகவும்' },
  'login.register': { en: 'Create Account', ta: 'கணக்கை உருவாக்கு' },
  'login.register_sub': { en: 'Join Aalayam today', ta: 'இன்றே Aalayam இல் சேருங்கள்' },
  'login.email': { en: 'Email', ta: 'மின்னஞ்சல்' },
  'login.password': { en: 'Password', ta: 'கடவுச்சொல்' },
  'login.fullname': { en: 'Full Name', ta: 'முழு பெயர்' },
  'login.no_account': { en: "Don't have an account?", ta: 'கணக்கு இல்லையா?' },
  'login.has_account': { en: 'Already have an account?', ta: 'ஏற்கனவே கணக்கு உள்ளதா?' },
  'login.register_link': { en: 'Register', ta: 'பதிவு செய்' },

  // ===== Features Page =====
  'nav.features': { en: 'Features', ta: 'அம்சங்கள்' },
  'feat.title': { en: 'Our Features', ta: 'எங்கள் அம்சங்கள்' },
  'feat.subtitle': { en: 'Explore the complete Aalayam platform', ta: 'முழுமையான Aalayam தளத்தை ஆராயுங்கள்' },
  'feat.breadcrumb': { en: 'Features', ta: 'அம்சங்கள்' },
  'feat.total_features': { en: 'Total Features', ta: 'மொத்த அம்சங்கள்' },
  'feat.ai_powered': { en: 'AI Powered', ta: 'AI இயக்கம்' },
  'feat.management': { en: 'Management', ta: 'மேலாண்மை' },
  'feat.services': { en: 'Services', ta: 'சேவைகள்' },
  'feat.all': { en: 'All Features', ta: 'அனைத்து அம்சங்கள்' },
  'feat.cat_ai': { en: 'AI Features', ta: 'AI அம்சங்கள்' },
  'feat.cat_core': { en: 'Core', ta: 'முக்கிய' },
  'feat.cat_monitor': { en: 'Monitoring', ta: 'கண்காணிப்பு' },
  'feat.cat_info': { en: 'Services', ta: 'சேவைகள்' },
  'feat.hero_label': { en: 'Flagship Features', ta: 'முக்கிய அம்சங்கள்' },
  'feat.hero_badge': { en: 'What Sets Us Apart', ta: 'எங்களை தனித்துவமாக்குவது' },
  'feat.more_label': { en: 'More Tools & Services', ta: 'மேலும் கருவிகள் & சேவைகள்' },
  'feat.cta_title': { en: 'Ready to Transform Temple Management?', ta: 'கோயில் மேலாண்மையை மாற்ற தயாரா?' },
  'feat.cta_desc': { en: 'Experience the power of AI-driven crowd management', ta: 'AI இயக்க கூட்ட மேலாண்மையின் சக்தியை அனுபவியுங்கள்' },
};

// Language state
const LANG_KEY = 'aalayam.lang';

function getCurrentLang() {
  return localStorage.getItem(LANG_KEY) || 'en';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations(lang);
  updateToggleUI(lang);
}

function toggleLang() {
  const current = getCurrentLang();
  setLang(current === 'en' ? 'ta' : 'en');
}

/**
 * Translate a key to the current (or specified) language.
 * Use in JS template literals: t('key') or t('key', 'ta')
 */
function t(key, lang) {
  const l = lang || getCurrentLang();
  const entry = I18N[key];
  return (entry && entry[l]) || (entry && entry.en) || key;
}

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const entry = I18N[key];
    if (!entry || !entry[lang]) return;

    // Handle different element types
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' && (el.type === 'text' || el.type === 'number' || el.type === 'email' || el.type === 'password')) {
      el.placeholder = entry[lang];
    } else if (tag === 'option') {
      el.textContent = entry[lang];
    } else {
      el.textContent = entry[lang];
    }
  });
  // Update html lang attribute
  document.documentElement.lang = lang === 'ta' ? 'ta' : 'en';
}

function updateToggleUI(lang) {
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    const en = btn.querySelector('.lang-en');
    const ta = btn.querySelector('.lang-ta');
    if (en && ta) {
      en.style.background = lang === 'en' ? '#C89B63' : '';
      en.style.color = lang === 'en' ? '#3A2618' : '';
      en.style.fontWeight = lang === 'en' ? '700' : '400';
      ta.style.background = lang === 'ta' ? '#C89B63' : '';
      ta.style.color = lang === 'ta' ? '#3A2618' : '';
      ta.style.fontWeight = lang === 'ta' ? '700' : '400';
    }
  });
}

// Auto-apply on page load
document.addEventListener('DOMContentLoaded', () => {
  const lang = getCurrentLang();
  applyTranslations(lang);
  updateToggleUI(lang);
});

// Expose globally
window.Aalayam = window.Aalayam || {};
window.Aalayam.i18n = { getCurrentLang, setLang, toggleLang, t, I18N };
