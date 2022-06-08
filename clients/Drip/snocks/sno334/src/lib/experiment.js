// import { setup, fireEvent } from '../../../../../core-files/services';
// import shared from '../../../../../core-files/shared';
import { pollerLite } from '../../../../../../globalUtil/util';

import addScript from './helpers/addScript';
import getActiveSku from './helpers/getActiveSku';
import getRecommProdData from './helpers/getRecommProdData';

import initReviews from './helpers/initReviews';
import { isPDP, isPLP, skusOnPage, thingsToPollFor } from './helpers/utils';

const init = (dataObj) => {
  if (isPLP || !!document.querySelector('.ProductListWrapper')) {
    const plpList = document.querySelectorAll('.ProductList.ProductList--grid .ProductItem');
    const carouselList = document.querySelectorAll('.ProductRecommendations .ProductItem');
    const productCards = isPLP
      ? plpList
      : document.querySelector('.ProductListWrapper')
      ? carouselList
      : null;

    pollerLite([() => window.ratingSnippet !== undefined], () => {
      productCards.forEach((card, index) => {
        const cardProdId = card
          .querySelector('.ProductItem__Info h2.ProductItem__Title.Heading a')
          ?.getAttribute('href')
          .split('variant=')[1];

        const cardSku = skusOnPage(dataObj)[cardProdId];
        console.log(cardProdId);

        const ratingsIoWidget = `<div class="sno334__container-rating ruk_rating_snippet sno334__container-rating--${index}" data-sku="${cardSku}"></div>`;
        card.querySelector(`.jdgm-widget`)?.classList.add(`sno334__hide`);
        card.querySelector('.sno334__container-rating')?.remove();
        card
          .querySelector('.ProductItem__TitleDescription')
          ?.insertAdjacentHTML('afterend', ratingsIoWidget);
      });
      // eslint-disable-next-line no-undef
      ratingSnippet('ruk_rating_snippet', {
        store: 'snocks',
        mode: 'default',
        color: '#F9CA4F',
        linebreak: false,
        lang: 'en',
        usePolaris: true,
        showEmptyStars: true,
      });
    });
  }

  if (!isPDP) return;
  const activeSku = getActiveSku();

  // console.log(activeSku);
  document.getElementById('ReviewsWidget')?.remove();
  document.querySelector('.ruk_rating_snippet')?.remove();
  const ratingsIoWidget = `<div class="sno334__container-rating ruk_rating_snippet" data-sku="${activeSku}"></div>`;

  const reviewsioWidget = '<div id="ReviewsWidget" class="sno334__container Container"></div>';
  document
    .getElementById('judgeme_product_reviews')
    .insertAdjacentHTML('beforebegin', reviewsioWidget);

  document.querySelector(`.jdgm-widget`)?.classList.add(`sno334__hide`);
  document.querySelector(`.jdgm-rev-widg`)?.classList.add(`sno334__hide`);

  document.querySelector(`.ProductItem__Info .jdgm-widget `).classList.add(`sno334__hide`);

  const ratingsIoWidgetWrapper = `<div class="sno334__container-rating-wrapper" href="#ReviewsWidget"></div>`;
  document
    .querySelector('.product-price-review-css')
    .insertAdjacentHTML('beforeend', ratingsIoWidgetWrapper);
  document
    .querySelector('.sno334__container-rating-wrapper')
    .insertAdjacentHTML('beforeend', ratingsIoWidget);

  initReviews(activeSku);
};

export default () => {
  pollerLite(thingsToPollFor, () => {
    const appContainer = document.querySelector('.Product__Info');
    const reviewsioJs = 'https://widget.reviews.io/polaris/build.js';
    const ratingsJs = 'https://widget.reviews.io/rating-snippet/dist.js';
    const revStyle = 'https://widget.reviews.io/rating-snippet/dist.css';
    const link = document.createElement('link');

    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = `${revStyle}`;
    document.querySelector('head').append(link);
    addScript(reviewsioJs);
    addScript(ratingsJs);

    const renderRecommStar = async () => {
      const recommProducts = document.querySelectorAll(
        '.ProductRecommendations a.ProductItem__ImageWrapper'
      );
      // console.log(recommProducts);
      let promises = [];
      for (let index = 0; index < recommProducts.length; index++) {
        const prodHref = recommProducts[index].getAttribute('href');
        if (prodHref) {
          promises.push(getRecommProdData(prodHref));
        }
      }
      const data = await Promise.all(promises);
      const normalisedData = data.reduce((prev, curr) => {
        prev[curr.product.id] = curr.product;
        return prev;
      }, {});
      window.collectionProducts = normalisedData;
      setTimeout(() => {
        init(window.collectionProducts);
      }, 2000);
    };
    !isPLP && renderRecommStar();

    setTimeout(() => {
      init(window.collectionProducts);
    }, 2000);
    let oldHref = location.href;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (oldHref != location.href) {
          oldHref = location.href;

          const { addedNodes } = mutation;
          addedNodes.forEach((addedNode) => {
            setTimeout(() => {
              init(window.collectionProducts);
            }, 2000);
          });
        }
      });
    });

    const config = {
      childList: true,
      subtree: true,
    };

    isPDP && observer.observe(appContainer, config);
  });
};
