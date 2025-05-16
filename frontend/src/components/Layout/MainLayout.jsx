import Header from '../Header';
import Footer from '../Footer';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full p-0 m-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}