// Router đơn giản cho SPA (sẽ dùng trong các trang độc lập)
export class Router {
  constructor(routes) {
    this.routes = routes;
    window.addEventListener('popstate', () => this.resolve());
    document.addEventListener('click', e => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });
  }

  navigate(url) {
    history.pushState(null, null, url);
    this.resolve();
  }

  resolve() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path) || this.routes[0];
    document.getElementById('app').innerHTML = route.component();
  }
}