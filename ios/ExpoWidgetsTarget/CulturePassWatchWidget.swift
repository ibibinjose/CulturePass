import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CulturePassWatchWidget: Widget {
  let name: String = "CulturePassWatchWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("CulturePass Glance")
    .description("Ultra-compact next event or ticket for Lock Screen and Apple Watch.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}
