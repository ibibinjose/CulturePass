import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureSpotlightWidget: Widget {
  let name: String = "CultureSpotlightWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Culture Spotlight")
    .description("Featured culture and picks from CulturePass.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}