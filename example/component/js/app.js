require.config({
    paths: {
        'datenwelt.Component': 'lib/component',
        'datenwelt.Model': 'lib/model',
        'datenwelt.Promise': 'lib/promise',
        'virtualDom': 'lib/third-party/virtual-dom',
        'Handlebars': 'lib/third-party/handlebars',
        'html2hscript': 'lib/third-party/html2hscript',
        'superagent': 'lib/third-party/superagent'
    }
});

require(['datenwelt.Component'], function (Component) {

    var TRANSLATIONS = {
        'de': {
            about: 'Über uns',
            contact: 'Kontakt',
            register: 'Registrieren',
            login: 'Login'
        },
        'en': {
            about: 'About',
            contact: 'Contact',
            register: 'Sign up',
            login: 'Login'
        }
    }

    var builder = new Component();

    builder.addAction('initialState', function () {
        var state = {
            language: {
                selected: 'en',
                available: ['de', 'en', 'fr']
            },
            menu: {
                about: '#about',
                contact: '#contact',
                register: '#register',
                login: '#login'
            },
            translation: TRANSLATIONS['en']
        };
        return state;
    });

    builder.addAction('changeLanguage', function (lang) {
        var state = {
            language: {
                selected: lang,
                available: ['de', 'en', 'fr']
            },
            menu: {
                about: '#about',
                contact: '#contact',
                register: 'register',
                login: 'login'
            },
            translation: TRANSLATIONS[lang]
        };
        return state;
    });

    Component.template('html/nav.html').then(function (template) {
        builder.withTemplate(template);

        var nav = builder.build('#nav');
        nav.initialState();
    });

});
