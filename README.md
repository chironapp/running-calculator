# running-calculator

[Click here for Demo.](https://calculator.chironapp.com/)

A simple client-side running calculator that estimates training paces and predicts race times based on a recent race result. The calculator can also calculate Critical Speed and D' prime based on two data points and plot the speed-duraton curve. There is a track calculator for working out splits on a 400m track as well.

## The math

The calculator is written in javascript so no server required.

Use a single race result provides a good ballpark but does not factor in variables such as training volume, experience, age, `D'` or multiple distance race results so will have limited accuracy, particularly in the longer distances >30km. Use Critical Speed for a more accurate prediction.

When using a single race result, race times and training zones are predicted using the formula by [Peter Riegel](https://en.wikipedia.org/wiki/Peter_Riegel):

`T2 = T1 x (D2/D1)^1.06`

or the inverse:

`pace = T2/D2 = T2/(D1 x (T2/T1)^0.943)`

Where:

- T1 is the time achieved for D1.
- T2 is the time predicted for D2.
- D1 is the distance over which the initial time is achieved.
- D2 is the distance for which the time is to be predicted.

Training Paces are estimated using percentages of Critical Speed as determined by [Dr Philip Skiba](https://physfarm.com) in his book, [Scientific Training For Endurance Athletes (2022)](http://physfarm.com/new/?p=1438).

A good technical description of the power-duration asymptote (Critical Power, `CP`), work above `CP` (`W'`), the equivalent speed-duration asymptote (Critical Speed, `CS`) and distance above `CS` (`D'`) and why they are useful can be found in the 2017 paper [Critical Power: An Important Fatigue Threshold in Exercise Physiology](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5070974/) by Prof Andy Jones et al.

## The style

Built using [Bootstrap v5.3.3](https://getbootstrap.com/). Theming generated using sass, see `styles/custom.scss`.
