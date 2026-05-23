import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureIdentityQRWidget: Widget {
  let name: String = "CultureIdentityQRWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Culture ID")
    .description("Your CulturePass member details.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}