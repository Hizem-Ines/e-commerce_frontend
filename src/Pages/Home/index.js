import { useState, useEffect } from 'react';
import HeroSlider from '../../Components/Home/HeroSlider';
import Categories from '../../Components/Home/Categories';
import NewProducts from '../../Components/Home/NewProducts';
import TrendingProducts from '../../Components/Home/TrendingProducts';
import FeaturedProducts from '../../Components/Home/FeaturedProducts';
import Banniere from '../../Components/Home/Banniere';
import { getHomeData } from '../../services/homeService';

const Home = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHomeData()
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <HeroSlider />
            <Categories categories={data?.categories || []} loading={loading} />
            <FeaturedProducts produits={data?.featuredProducts || []} loading={loading} />
            <NewProducts      produits={data?.newProducts      || []} loading={loading} />
            <TrendingProducts produits={data?.trendingProducts || []} loading={loading} />
            <Banniere />
        </>
    );
};

export default Home;