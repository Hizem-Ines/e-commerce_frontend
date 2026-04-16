import { Link } from 'react-router-dom';

const Categories = ({ categories, loading }) => {
    return (
        <section className="bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold font-serif text-[#2c2c2c] mb-2">
                        Nos Catégories
                    </h2>
                    <p className="text-black/50 text-base">
                        Explorez notre gamme complète de produits bio
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-[#f9f5f0] rounded-2xl p-8 animate-pulse h-32" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/produits?category_id=${cat.id}`}
                                className="group bg-[#f9f5f0] rounded-2xl  p-4 md:p-8 text-center cursor-pointer transition-all duration-300 hover:bg-[#2d5a27] hover:-translate-y-1 hover:shadow-xl no-underline"
                            >
                                {cat.images?.[0]?.url ? (
                                    <img src={cat.images[0].url} alt={cat.name_fr} className="w-12 h-12 object-cover rounded-xl mx-auto mb-3" />
                                ) : (
                                    <div className="text-5xl mb-3">🌿</div>
                                )}
                                <h3 className="text-sm font-bold text-[#2c2c2c] group-hover:text-white mb-2 transition-colors duration-300">
                                    {cat.name_fr}
                                </h3>
                                <span className="text-xs text-black/50 bg-black/5 group-hover:text-white group-hover:bg-white/20 px-3 py-1 rounded-full transition-colors duration-300">
                                    {cat.product_count || 0} produits
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Categories;