import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Navigation from '../Navigation';
import Footer from '../Footer';

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#fdf6ec] ">
            <div className="sticky top-0 z-50">
                <Header />
                <Navigation />
            </div>
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;