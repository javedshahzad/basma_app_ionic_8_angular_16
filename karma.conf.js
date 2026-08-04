// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/ngv'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true,
    // الافتراضي (30 ثانية) غير كافٍ: عدد كبير من الصفحات ينشئ setInterval حقيقياً
    // في المُنشئ (constructor)، ولا يوجد استدعاء تلقائي لـ ngOnDestroy بين اختبار
    // وآخر في TestBed، فتتراكم المؤقتات عبر الجلسة الواحدة وتُبطئ التنفيذ تدريجياً
    browserNoActivityTimeout: 120000,
    // مع تراكم عشرات المكوّنات المُصيَّرة فعلياً (أشجار Ionic معقدة) ضمن نفس
    // جلسة المتصفح الواحدة، قد ينهار Chrome Headless لضغط الذاكرة قرب نهاية
    // التشغيل الكامل. السماح بإعادة اتصال محدودة بدل فشل التشغيل بالكامل
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 30000
  });
};
