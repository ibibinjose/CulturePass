import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureUpcomingTicketWidget: Widget {
  let name: String = "CultureUpcomingTicketWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Next Ticket")
    .description("Your next ticket — open the app for the full QR.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}