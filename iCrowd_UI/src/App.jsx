function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="rounded-2xl bg-white p-10 shadow-2xl">
        <h1 className="text-5xl font-extrabold tracking-tighter text-blue-600">
          iCrowd <span className="text-orange-500">Tailwind</span> Test
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          If you see a dark background and a blue/orange title, it works!
        </p>
        <button className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors">
          Verify Connection
        </button>
      </div>
    </div>
  )
}

export default App