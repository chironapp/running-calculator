# running-calculator

[Click here for Demo.](https://clivegross.github.io/running-calculator/)

A simple client-side running calculator that estimates training paces and predicts race times based on a recent race result. There is a track calculator for working out splits on a 400m track as well.

The calculator is written in javascript so no server required.

These calculations provide a good ballpark but do not factor in variables such as training volume, experience, age, `D'` or multiple distance race results so will have limited accuracy, particularly in the longer distances >30km.

Race times are predicted using the formula by [Peter Riegel](https://en.wikipedia.org/wiki/Peter_Riegel):

`T2 = T1 x (D2/D1)^1.06`

Where:
- T1 is the time achieved for D1.
- T2 is the time predicted for D2.
- D1 is the distance over which the initial time is achieved.
- D2 is the distance for which the time is to be predicted.

Training Paces are estimated using percentages of Critical Speed as determined by [Dr Philip Skiba](https://physfarm.com) in his book, [Scientific Training For Endurance Athletes (2022)](http://physfarm.com/new/?p=1438).

Critical Speed (and `D'`) cannot be determined from a single race result and should be calculated mathematically from test data using the model proposed by Skiba in the above literature. This calculator estimates a `CS` range by predicting 30 to 40 minute race pace by rearranging Peter Riegel's formula:

`pace = T2/D2 = T2/(D1 x (T2/T1)^0.943)`

A good technical description of the power-duration asymptote (Critical Power, `CP`), work above `CP` (`W'`), the equivalent speed-duration asymptote (Critical Speed, `CS`) and distance above `CS` (`D'`) and why they are useful can be found in the 2017 paper [Critical Power: An Important Fatigue Threshold in Exercise Physiology](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5070974/) by Prof Andy Jones et al.
