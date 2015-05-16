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

.controller('StudiesCtrl', function($scope, $state, $ionicPlatform, $ionicModal, $ionicPopup, $localstorage, $cordovaBarcodeScanner, $http, dataLayer, devTest) {
// DEVTEST Data
  $scope.t_studies = [
    { title: 'Zeitverwendung im Studienalltag', id: 1 },
    { title: 'Langeweile im Praktikum', id: 2 }
  ];
  //DEV Buttons
  $scope.resetDatabase = function() {
    devTest.devReset();
    $scope.updateStudies();
    console.log('Datenbank wurde zurückgesetzt');
  }

  $scope.testHttp = function() {
    devTest.testHttp();
    $scope.updateStudies();

  }

  $scope.testDataImport = function() {
    devTest.testImport();
  }

  $scope.testDatabaseAccess = function() {
    //devTest.testDataBase();
  }

  $scope.substudies = [];
  $scope.substudies = null;
  $scope.hasSubstudies = false;
  $scope.allowSideMenu = true;


  $scope.checkForSubstudies = function() {
    if ($scope.substudies !== undefined && $scope.substudies !== null && $scope.substudies.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  $scope.updateStudies = function () {
    $ionicPlatform.ready(function() 
      { dataLayer.getStudiesWithSubstudies().then(function (res) {
        console.log(res);
        $scope.substudies = res;
        $scope.hasSubstudies = $scope.checkForSubstudies();
      })
    })
  };

  $scope.showSubstudyInfo = function(substudyId) {
    
    dataLayer.getSubstudyInfo(substudyId).then(function (res) {
      var substudyPopup = $ionicPopup.alert({
        title: 'Studieninformationen',
        template: '<p><strong>Ihre ID:</strong> ' + res.subject_id + '</p>'+ '<p><strong>Beschreibung für ' + res.study_name + ':</strong> ' + res.study_description + '</p><p>' + res.substudy_description + '</p>'
      });
      substudyPopup;
    })
  };

  $scope.loadSubstudy = function(substudyId) {
    var substudyData = {};
    
    dataLayer.startSubstudy(substudyId).then(function (res) {
    dataLayer.getQuestiongroup(res.id).then(function (res2) {
      // console.log("QG ID:");
      // console.log(res);
      // console.log("QG Data:");
      // console.log(res2);
      return res2.id;
      }).then(function (qgId) {
        dataLayer.getQuestionsByQuestiongroupId(qgId).then(function (questions) {
          console.log(questions);
        });
      })
      })
      
    dataLayer.getNextQuestiongroup(2);

    

    //   $state.go('app.questiongroup', {'questiongroupId': substudyId});
    // }, function (err) {
    //   console.error(err);
    // });
  }

  $scope.updateStudies();


})

.controller('QuestiongroupCtrl', function($scope, $ionicPlatform, $stateParams, $ionicSideMenuDelegate) {
  //Disable Back Button 
  $ionicPlatform.registerBackButtonAction(function (event) {
                    event.preventDefault();
            }, 100);
  //Disable Side Menu
  $scope.allowSideMenu = false;

  console.log($stateParams.questiongroupId);
  console.log($scope.allowSideMenu);

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
