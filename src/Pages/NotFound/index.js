import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fdf6ec] px-6 text-center">

            {/* NUMÉRO */}
            <h1 className="text-[100px] sm:text-[150px] font-black font-serif text-[#2d5a27] leading-none mb-2 sm:mb-4">
                404
            </h1>

            {/* ICÔNE */}
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🌿</div>

            {/* TEXTE */}
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#2c2c2c] mb-2 sm:mb-3">
                Page introuvable
            </h2>
            <p className="text-black/50 text-sm sm:text-base max-w-xs sm:max-w-md mb-6 sm:mb-8">
                La page que vous cherchez n'existe pas ou a été déplacée.
                Retournez à l'accueil pour continuer vos achats.
            </p>

            {/* BOUTONS */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link
                    to="/"
                    className="bg-[#2d5a27] hover:bg-[#1a3d15] text-white font-bold px-8 py-3 rounded-full transition-colors duration-300 no-underline text-center"
                >
                    Retour à l'accueil
                </Link>
                <Link
                    to="/produits"
                    className="border-2 border-[#2d5a27] text-[#059669] hover:bg-[#2d5a27] hover:text-white font-bold px-8 py-3 rounded-full transition-colors duration-300 no-underline text-center"
                >
                    Voir les produits
                </Link>
            </div>

        </div>
    );
};

export default NotFound;