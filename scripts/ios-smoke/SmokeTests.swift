import XCTest

final class SmokeTests: XCTestCase {
  func testCustomerAndDriverNativeHomes() throws {
    continueAfterFailure = false
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    for (role, email, greeting, port) in [("customer", "alex@example.test", "Hello, Alex", 8081), ("driver", "brian@example.test", "Hello, Brian", 8082)] {
      let app = XCUIApplication(bundleIdentifier: "ug.co.loadmaster.v2.\(role)")
      app.terminate()
      app.launch()
      XCUIDevice.shared.system.open(URL(string: "loadmaster-\(role)://expo-development-client/?url=http%3A%2F%2Flocalhost%3A\(port)&__expo_disable_fab=1&__expo_disable_onboarding=1")!)
      if springboard.buttons["Open"].waitForExistence(timeout: 5) { springboard.buttons["Open"].tap() }
      for _ in 0..<8 {
        if springboard.buttons["Allow"].exists { springboard.buttons["Allow"].tap() }
        if app.buttons["Continue"].exists { app.buttons["Continue"].tap() }
        if app.buttons["Close"].exists { app.buttons["Close"].firstMatch.tap() }
        if app.buttons["Explore with a demo account"].exists { break }
        if app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", greeting)).firstMatch.exists { break }
        Thread.sleep(forTimeInterval: 2)
        app.swipeUp()
      }
      let explore = app.buttons["Explore with a demo account"]
      if explore.exists { explore.tap() }
      if role == "customer" && app.tabBars.buttons["Account"].exists && !app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@",greeting)).firstMatch.exists {
        app.tabBars.buttons["Account"].tap()
        let setup=app.buttons.containing(NSPredicate(format:"label CONTAINS %@","Demo connection & accounts")).firstMatch
        XCTAssertTrue(setup.waitForExistence(timeout:10));setup.tap()
        app.descendants(matching:.any).matching(NSPredicate(format:"label == %@","Alex Mukasa")).firstMatch.tap()
        app.buttons["Save & reconnect"].tap()
        app.tabBars.buttons["Home"].tap()
      }
      let home = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", greeting)).firstMatch
      XCTAssertTrue(home.waitForExistence(timeout: 25), "\(email) home failed: \(app.debugDescription)")
      if role == "customer" {
        XCTAssertTrue(app.staticTexts["What are we moving today?"].exists)
        let first = XCTAttachment(screenshot: app.screenshot()); first.name="figma-home-ios"; first.lifetime = .keepAlways; add(first)
        app.buttons["Order a cargo truck"].tap()
        XCTAssertTrue(app.staticTexts["Move anything, anywhere."].waitForExistence(timeout: 10))
        app.buttons["Choose pickup location"].tap()
        app.buttons["Select Ntinda Shopping Centre"].tap()
        app.buttons["Choose destination"].tap()
        app.buttons["Select Nakawa Market"].tap()
        let order = XCTAttachment(screenshot: app.screenshot()); order.name="figma-order-ios"; order.lifetime = .keepAlways; add(order)
        app.buttons["Continue to truck selection"].tap()
        XCTAssertTrue(app.staticTexts["Truck & destinations"].waitForExistence(timeout: 10))
        app.buttons["Back"].firstMatch.tap()
        app.buttons["Back"].firstMatch.tap()
        let funds=app.buttons["Add funds"]
        for _ in 0..<4 { if funds.frame.midY < app.frame.height - 130 { break }; app.swipeUp() }
        funds.tap()
        XCTAssertTrue(app.buttons["Close wallet"].waitForExistence(timeout:10), app.debugDescription)
        for _ in 0..<3 { if app.buttons["Approve demo top-up"].exists || app.buttons["Check top-up status"].exists { break }; app.swipeUp() }
        if app.buttons["Check top-up status"].waitForExistence(timeout: 2) { app.buttons["Check top-up status"].tap(); Thread.sleep(forTimeInterval: 2) }
        XCTAssertTrue(app.buttons["Approve demo top-up"].waitForExistence(timeout: 10))
        app.otherElements["Pending"].tap()
        app.buttons["Approve demo top-up"].tap()
        XCTAssertTrue(app.buttons["Check top-up status"].waitForExistence(timeout: 10))
        Thread.sleep(forTimeInterval: 1)
        app.buttons["Check top-up status"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@", "added to your demo wallet")).firstMatch.waitForExistence(timeout:10))
        let closeWallet=app.buttons["Close wallet"]
        closeWallet.tap()
        expectation(for: NSPredicate(format:"exists == false"), evaluatedWith:closeWallet)
        waitForExpectations(timeout:5)
        let initiallyHidden=app.buttons["Show wallet balance"].exists
        app.buttons[initiallyHidden ? "Show wallet balance" : "Hide wallet balance"].tap()
        let toggled=app.buttons[initiallyHidden ? "Hide wallet balance" : "Show wallet balance"]
        XCTAssertTrue(toggled.waitForExistence(timeout: 5))
        let privacy = XCTAttachment(screenshot: app.screenshot()); privacy.name="figma-wallet-hidden-ios"; privacy.lifetime = .keepAlways; add(privacy)
        toggled.tap()
        func switchCustomer(_ name: String, greeting: String) {
          app.tabBars.buttons["Account"].tap()
          let setup=app.buttons.containing(NSPredicate(format:"label CONTAINS %@", "Demo connection & accounts")).firstMatch
          if !setup.waitForExistence(timeout:3) {
            app.coordinate(withNormalizedOffset:CGVector(dx:0.875,dy:0.94)).tap()
          }
          XCTAssertTrue(setup.waitForExistence(timeout:10)); setup.tap()
          let accountChoice=app.descendants(matching:.any).matching(NSPredicate(format:"label == %@",name)).firstMatch
          XCTAssertTrue(accountChoice.waitForExistence(timeout: 10)); accountChoice.tap()
          app.buttons["Save & reconnect"].tap()
          app.tabBars.buttons["Home"].tap()
          XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", greeting)).firstMatch.waitForExistence(timeout: 15))
        }
        switchCustomer("Sarah Nakato", greeting: "Hello, Sarah")
        XCTAssertTrue(app.buttons["Next artwork"].waitForExistence(timeout: 10))
        app.buttons["Next artwork"].tap()
        XCTAssertTrue(app.staticTexts["Household moves"].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1)
        let carousel = XCTAttachment(screenshot: app.screenshot()); carousel.name="backup-household-carousel-ios"; carousel.lifetime = .keepAlways; add(carousel)
        app.buttons["Show artwork 3: Business deliveries"].tap()
        XCTAssertTrue(app.staticTexts["Business deliveries"].waitForExistence(timeout: 5))
        switchCustomer("Alex Mukasa", greeting: "Hello, Alex")
      }
      XCTAssertTrue(app.tabBars.firstMatch.exists, "Native tab bar is present")
      let tab = app.tabBars.buttons[role == "customer" ? "Orders" : "Deliveries"]
      XCTAssertTrue(tab.exists)
      tab.tap()
      app.terminate()
      app.launch()
      XCTAssertTrue(home.waitForExistence(timeout: 25), "Secure session restores after restarting \(role): \(app.debugDescription)")
      Thread.sleep(forTimeInterval: 4)
      let screenshot = XCTAttachment(screenshot: app.screenshot())
      screenshot.name = "\(role)-ios-native-home"
      screenshot.lifetime = .keepAlways
      add(screenshot)
      app.terminate()
    }
  }
}
