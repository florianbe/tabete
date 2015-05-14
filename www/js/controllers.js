angular.module('tabete.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicSideMenuDelegate, $localstorage) {
  // Create the password modal that we will use later
  $ionicModal.fromTemplateUrl('templates/password.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalPassword = modal;
  });

  $scope.input = {};

  //Initialize settings - get from localstorage, create new if none exist.
  $scope.settings = $localstorage.getObject('settings');

  if (!$scope.settings.hasOwnProperty('passwordset'))
  {
    $scope.settings = {
    testmode:     false, 
    passwordset:  false,
    password:     ""
    };

    $localstorage.setObject('settings', $scope.settings);
  }

 //Slow slider down and set localstorage settings 
  $scope.toggleTestMode = function() {
        $timeout(function() {$ionicSideMenuDelegate.toggleLeft();}, 100);
        $localstorage.setObject('settings', $scope.settings);
  };
  // Triggered in the password modal to close it
  $scope.closePassword = function() {
    $scope.passworderror = "";
    $scope.modalPassword.hide();
  };

  // Open the password modal
  $scope.password = function() {
    $scope.modalPassword.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doPassword = function() {
    
    if($scope.settings.passwordset){
      if($scope.settings.password === $scope.input.password){
        $scope.settings.password = "";
        $scope.input.password = "";
        $scope.settings.passwordset = false;
        $scope.closePassword();
      }
      else {
        alert("Falsches Passwort");
      }
    }
    else {
      if ($scope.input.password === undefined || $scope.input.password === ""){
        alert("Das Password darf nicht leer sein");
      } else {
        $scope.settings.password = $scope.input.password;
        $scope.settings.passwordset = true;
        $localstorage.setObject('settings', $scope.settings);
        $scope.input.password = "";
        $scope.closePassword();
      }
    }
  };
})

.controller('StudiesCtrl', function($scope, $ionicModal, $cordovaBarcodeScanner, $http, dataLayer, devTest) {
// DEVTEST Data
  $scope.studies = [
    { title: 'Zeitverwendung im Studienalltag', id: 1 },
    { title: 'Langeweile im Praktikum', id: 2 }
  ];
  //DEV Buttons
  $scope.resetDatabase = function() {
    devTest.devReset();
    console.log('Datenbank wurde zurückgesetzt');
  }

  $scope.testHttp = function() {
    devTest.testHttp();
  }

  $scope.testDataImport = function() {
    devTest.testImport();
  }

  $scope.testDatabaseAccess = function() {
    devTest.testDataBase();
  }

})  

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
