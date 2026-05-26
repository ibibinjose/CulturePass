import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureMembershipWidget: Widget {
  let name: String = "CultureMembershipWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Membership")
    .description("Your CulturePass+ tier, renewal date, and cashback balance.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
  }
}