{
  /* Quick Actions - Sophisticated Styling */
}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
    <h3 className="text-xl font-medium mb-2">Talk to eSaha</h3>
    <p className="text-blue-50 mb-4">
      Share your thoughts or get support anytime
    </p>
    <Button
      className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
      onClick={() => navigate('/chat/new')}
    >
      Start a Conversation
    </Button>
  </div>

  <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
    <h3 className="text-xl font-medium mb-2">Track Your Mood</h3>
    <p className="text-rose-50 mb-4">Record how you're feeling today</p>
    <Button
      className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
      onClick={() => navigate('/mood')}
    >
      Log Your Mood
    </Button>
  </div>

  <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
    <h3 className="text-xl font-medium mb-2">Schedule Session</h3>
    <p className="text-amber-50 mb-4">Book a therapy session or check-in</p>
    <Button
      className="mt-auto bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-white/20"
      onClick={() => navigate('/appointments')}
    >
      Manage Appointments
    </Button>
  </div>
</div>;
