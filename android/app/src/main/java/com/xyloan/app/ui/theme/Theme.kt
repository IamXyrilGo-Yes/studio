
package com.xyloan.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PrimaryBlue = Color(0xFF3B5998)
private val AccentBlue = Color(0xFF5DADE2)
private val BackgroundLight = Color(0xFFF2F4F7)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryBlue,
    secondary = AccentBlue,
    tertiary = Color.White,
    background = BackgroundLight,
    surface = Color.White
)

@Composable
fun XyLoanTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) LightColorScheme else LightColorScheme, // Keeping it consistent with web design
        typography = Typography,
        content = content
    )
}
