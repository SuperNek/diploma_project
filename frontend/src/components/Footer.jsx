export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 w-full">
      <div className="w-full px-4 text-center text-gray-500 text-sm">
        {new Date().getFullYear()} Система управления заявками
      </div>
    </footer>
  );
}