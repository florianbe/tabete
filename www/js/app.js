// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('tabete', ['ionic', 'ionic.utils', 'ionic.ion.autoListDivider', 'ngCordova', 'tabete.services', 'tabete.controllers'])

.run(function($ionicPlatform, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //Database: open web DB or SQLITE
    if(window.cordova) {
      // App syntax
      db = $cordovaSQLite.openDB("tabete.db");
    } else {
      // Ionic serve syntax
      db = window.openDatabase("tabete.db", "1.0", "Cordova Demo", 200000);
    }

    //Database: create tables
        //SERVERS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS servers (id integer primary key, url text, subject_id integer, subject_name text)");
        //STUDIES
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS studies (id integer primary key, version integer, server_id integer, remote_id integer, name text, description text, password text, state text, start_date text, end_date text, finalupload_date text)");
        //SUBSTUDIES
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS substudies (id integer primary key, version integer, study_id integer, title text, triggertype text, description text)");
        //SIGNAL POINTS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS signalpoints (id integer primary key, substudy_id integer, signal_date text)");
        //QUESTION GROUPS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questiongroups (id integer primary key, version integer, substudy_id integer, name text, sequence_id integer, randomorder integer)");
        //RULES
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS rules (id integer primary key, questiongroup_id integer, question_id integer, answer_value text)");
        //QUESTIONS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questions (id integer primary key, remote_id integer, version integer, questiongroup_id integer, sequence_id integer, type text, mandatory integer, text text, min text, max text, step text)");
        //QUESTIONS OPTIONS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questionoptions (id integer primary key, question_id integer, code text, description text, value text)");
        //ANSWERS
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS answers (id integer primary key, question_id integer, answer text, testanswer integer, answer_date text, signal_date text)");
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.studies', {
      url: "/studies",
      views: {
        'menuContent': {
          templateUrl: "templates/studies.html",
          controller: 'StudiesCtrl'
        }
      }
    })

  .state('app.questiongroup', {
    cache: false,
    url: "questiongroup/:questiongroupId",
    views: {
      'menuContent': {
        templateUrl: "templates/questiongroup.html",
        controller: 'QuestiongroupCtrl',
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/studies');
});
