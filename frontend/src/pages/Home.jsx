export default function Home() {
  return (
    <div className="flex flex-col items-center text-center mt-10 px-4">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-700 mb-4">
        Welcome to TouchHub
      </h1>
      <p className="text-gray-700 text-base sm:text-lg mb-6 max-w-md leading-relaxed">
        Create, visualize, and share your Touch Rugby plays with teammates and coaches.
      </p>
      <p className="text-gray-500 text-sm">Use the navigation menu above to get started.</p>
      <br></br>
      <p className="text-gray-400 text-sm">Note: Play creation is best done on PC, not mobile</p>
    </div>
  );
}
