import WidgetKit
import SwiftUI
internal import ExpoWidgets

@main
struct ExportWidgets0: WidgetBundle {
  var body: some Widget {
    CultureSpotlightWidget()
    CultureNearYouWidget()
    CultureIdentityQRWidget()
    CultureUpcomingTicketWidget()
    ExportWidgets1().body
  }
}

struct ExportWidgets1: WidgetBundle {
  var body: some Widget {
    CulturePassWatchWidget()
    CultureMembershipWidget()
    WidgetLiveActivity()
  }
}