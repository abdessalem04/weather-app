# MétéoVision - Application de Prévisions Météo

MétéoVision est une application web élégante qui affiche les prévisions météorologiques actuelles et sur 10 jours pour n'importe quelle ville dans le monde. L'application utilise l'API WeatherAPI pour récupérer des données météorologiques précises.

## Fonctionnalités

- Affichage de la météo actuelle avec température, description, vitesse du vent et humidité
- Prévisions détaillées sur 10 jours
- Recherche de météo par ville
- Interface responsive adaptée à tous les appareils
- Design moderne et intuitif

## Comment utiliser

1. Ouvrez le fichier `index.html` dans votre navigateur
2. Par défaut, l'application affiche la météo pour Paris
3. Entrez le nom d'une ville dans la barre de recherche et cliquez sur l'icône de recherche (ou appuyez sur Entrée)
4. Consultez les prévisions météorologiques actuelles et sur 10 jours

## Configuration de l'API

Pour que l'application fonctionne correctement, vous devez obtenir une clé API gratuite auprès de WeatherAPI :

1. Créez un compte sur [WeatherAPI](https://www.weatherapi.com/)
2. Obtenez votre clé API gratuite
3. Ouvrez le fichier `js/app.js`
4. Remplacez `'YOUR_API_KEY'` par votre clé API réelle :
   ```javascript
   const API_KEY = 'votre_clé_api_ici';
   ```

## Technologies utilisées

- HTML5
- CSS3 (avec Flexbox et Grid pour la mise en page)
- JavaScript (ES6+)
- Font Awesome pour les icônes
- Google Fonts (Roboto)
- WeatherAPI pour les données météorologiques

## Personnalisation

Vous pouvez facilement personnaliser l'application en modifiant les fichiers suivants :

- `css/style.css` - Pour modifier l'apparence et le style
- `js/app.js` - Pour modifier le comportement et les fonctionnalités
- `index.html` - Pour modifier la structure

## Limitations

La version gratuite de WeatherAPI permet jusqu'à 1 million d'appels par mois, ce qui est largement suffisant pour un usage personnel ou pour un petit site web.

## Licence

Ce projet est disponible sous licence MIT. Vous êtes libre de l'utiliser, de le modifier et de le distribuer comme bon vous semble.