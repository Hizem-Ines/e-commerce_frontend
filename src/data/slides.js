import dried_fruits from '../assets/images/dried_fruits.png';
import food from '../assets/images/food.png';
import organic from '../assets/images/organic.png';

const slides = [
    {
        id: 1,
        titre: "Fruits Secs",
        sousTitre: "Saveurs authentiques du terroir",
        description: "Amandes, noix, dattes et figues séchées, récoltés et préparés avec soin par nos producteurs locaux",
        image: dried_fruits,
        cta: "Découvrir les fruits secs",
        url: "/produits?categorie=fruits-secs",
    },
    
    {
        id: 2,
        titre: "Délices Maison",
        sousTitre: "Fraîchement préparé près de chez vous",
        description: "Découvrez confitures artisanales, pâtisseries et recettes traditionnelles faites avec amour",
        image: food,
        cta: "Voir les produits",
        url: "/produits?categorie=alimentation",
    },
    
    {
        id: 3,
        titre: "Naturel & Bio",
        sousTitre: "Ingrédients purs, vraies saveurs",
        description: "Miel, huile d'olive, tisanes et produits bio directement de nos fermes locales",
        image: organic,
        cta: "Voir le bio",
        url: "/produits?categorie=bio",
    },
];

export default slides;